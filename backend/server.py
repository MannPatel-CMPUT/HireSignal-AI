from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import secrets
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Constants
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

async def check_brute_force(identifier: str) -> bool:
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if not attempt:
        return False
    if attempt["count"] >= MAX_LOGIN_ATTEMPTS:
        lockout_until = attempt["last_attempt"] + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        if datetime.now(timezone.utc) < lockout_until:
            return True
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    return False

async def record_failed_login(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt:
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$set": {"count": attempt["count"] + 1, "last_attempt": datetime.now(timezone.utc)}}
        )
    else:
        await db.login_attempts.insert_one({
            "identifier": identifier,
            "count": 1,
            "last_attempt": datetime.now(timezone.utc)
        })

async def clear_failed_login(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str = "user"
    created_at: datetime

class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    experience_level: Optional[str] = "Mid-Level"
    tone_preference: Optional[str] = "Professional"

class ResumeAnalysisResponse(BaseModel):
    id: str
    user_id: str
    ats_score: int
    recruiter_score: int
    analysis: Dict[str, Any]
    created_at: datetime

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# Auth Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": password_hash,
        "name": user_data.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return UserResponse(
        id=user_id,
        email=email,
        name=user_data.name,
        role="user",
        created_at=user_doc["created_at"]
    )

@api_router.post("/auth/login", response_model=UserResponse)
async def login(user_data: UserLogin, request: Request, response: Response):
    email = user_data.email.lower()
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{email}"
    
    if await check_brute_force(identifier):
        raise HTTPException(status_code=429, detail="Too many failed login attempts. Please try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        await record_failed_login(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    await clear_failed_login(identifier)
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return UserResponse(
        id=user_id,
        email=user["email"],
        name=user["name"],
        role=user.get("role", "user"),
        created_at=user["created_at"]
    )

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user.get("role", "user"),
        created_at=current_user["created_at"]
    )

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": user["_id"],
        "email": email,
        "expires_at": expires_at,
        "used": False
    })
    
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={token}"
    logging.info(f"Password reset link: {reset_link}")
    
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    reset_token = await db.password_reset_tokens.find_one({"token": data.token})
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if reset_token["used"]:
        raise HTTPException(status_code=400, detail="Token already used")
    
    if datetime.now(timezone.utc) > reset_token["expires_at"]:
        raise HTTPException(status_code=400, detail="Token expired")
    
    password_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": reset_token["user_id"]},
        {"$set": {"password_hash": password_hash}}
    )
    
    await db.password_reset_tokens.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}

# Resume Analysis Routes
@api_router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(request_data: ResumeAnalysisRequest, current_user: dict = Depends(get_current_user)):
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        session_id = f"resume_analysis_{uuid.uuid4()}"
        
        system_message = f"""You are an expert resume analyzer acting as:
1. A senior recruiter at {request_data.company_name or 'a top company'}
2. An ATS (Applicant Tracking System) screening expert
3. A professional resume coach
4. A hiring manager making shortlisting decisions

Your task is to analyze the provided resume against a job description and provide detailed, actionable feedback.

IMPORTANT GUIDELINES:
- Be honest and constructive, never guarantee hiring
- Detect AI-written or overly generic content
- Focus on specific, believable improvements
- Provide natural-sounding suggestions
- Use metrics only when believable
- Explain WHY each change helps
- Consider the experience level: {request_data.experience_level}
- Use a {request_data.tone_preference} tone

Provide your response in valid JSON format with this exact structure:
{{
  "ats_score": <number 0-100>,
  "ats_explanation": "<2-3 sentences explaining the score>",
  "recruiter_score": <number 0-100>,
  "recruiter_explanation": "<2-3 sentences from recruiter perspective>",
  "ai_tone_detection": {{
    "has_ai_tone": <boolean>,
    "confidence": "<low/medium/high>",
    "issues": ["<specific issue 1>", "<specific issue 2>"],
    "examples": ["<robotic phrase from resume>"],
    "suggestions": ["<how to make it more natural>"]
  }},
  "keyword_match": {{
    "matched_keywords": ["<keyword1>", "<keyword2>"],
    "missing_keywords": ["<keyword1>", "<keyword2>"],
    "missing_technical_skills": ["<skill1>", "<skill2>"],
    "missing_soft_skills": ["<skill1>", "<skill2>"]
  }},
  "recruiter_feedback": {{
    "first_impression": "<honest first impression>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"],
    "standout_factor": "<what makes or could make this resume stand out>"
  }},
  "bullet_rewrites": [
    {{
      "original": "<original bullet point>",
      "issue": "<what's wrong with it>",
      "improved": "<better version>",
      "impact": "<why this helps>"
    }}
  ],
  "missing_content": {{
    "sections_to_add": ["<section 1>", "<section 2>"],
    "content_suggestions": ["<specific suggestion 1>", "<specific suggestion 2>"]
  }},
  "action_plan": {{
    "fix_immediately": ["<urgent fix 1>", "<urgent fix 2>"],
    "improve_next": ["<improvement 1>", "<improvement 2>"],
    "optional_polish": ["<optional 1>", "<optional 2>"],
    "top_3_changes": ["<top change 1>", "<top change 2>", "<top change 3>"]
  }}
}}"""
        
        user_message_text = f"""Please analyze this resume for the given job description.

RESUME:
{request_data.resume_text}

JOB DESCRIPTION:
{request_data.job_description}

TARGET ROLE: {request_data.role_title or 'Not specified'}
EXPERIENCE LEVEL: {request_data.experience_level}"""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=user_message_text)
        response_text = await chat.send_message(user_message)
        
        try:
            if response_text.strip().startswith("```json"):
                response_text = response_text.strip()[7:]
            if response_text.strip().endswith("```"):
                response_text = response_text.strip()[:-3]
            
            analysis = json.loads(response_text)
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse AI response as JSON: {e}")
            logging.error(f"Response text: {response_text}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
        report_doc = {
            "user_id": ObjectId(current_user["_id"]),
            "resume_text": request_data.resume_text[:1000],
            "job_description": request_data.job_description[:1000],
            "company_name": request_data.company_name,
            "role_title": request_data.role_title,
            "experience_level": request_data.experience_level,
            "tone_preference": request_data.tone_preference,
            "ats_score": analysis.get("ats_score", 0),
            "recruiter_score": analysis.get("recruiter_score", 0),
            "analysis": analysis,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await db.reports.insert_one(report_doc)
        report_id = str(result.inserted_id)
        
        return ResumeAnalysisResponse(
            id=report_id,
            user_id=current_user["_id"],
            ats_score=analysis.get("ats_score", 0),
            recruiter_score=analysis.get("recruiter_score", 0),
            analysis=analysis,
            created_at=report_doc["created_at"]
        )
    
    except Exception as e:
        logging.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    reports = await db.reports.find(
        {"user_id": ObjectId(current_user["_id"])},
        {"resume_text": 0, "job_description": 0}
    ).sort("created_at", -1).to_list(100)
    
    for report in reports:
        report["_id"] = str(report["_id"])
        report["user_id"] = str(report["user_id"])
    
    return reports

@api_router.get("/reports/{report_id}")
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    try:
        report = await db.reports.find_one({"_id": ObjectId(report_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if str(report["user_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    report["_id"] = str(report["_id"])
    report["user_id"] = str(report["user_id"])
    
    return report

@api_router.delete("/reports/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    try:
        report = await db.reports.find_one({"_id": ObjectId(report_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if str(report["user_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.reports.delete_one({"_id": ObjectId(report_id)})
    return {"message": "Report deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    cors_origins = [os.environ.get('FRONTEND_URL', 'http://localhost:3000')]
else:
    cors_origins = cors_origins.split(',')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event
@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.reports.create_index("user_id")
    await db.reports.create_index("created_at")
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@hiresignal.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    test_user_email = "test@hiresignal.com"
    test_user_password = "test123"
    test_user = await db.users.find_one({"email": test_user_email})
    if test_user is None:
        hashed = hash_password(test_user_password)
        await db.users.insert_one({
            "email": test_user_email,
            "password_hash": hashed,
            "name": "Test User",
            "role": "user",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Test user created: {test_user_email}")
    
    credentials_content = f"""# HireSignal AI Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Test User Account
- Email: {test_user_email}
- Password: {test_user_password}
- Role: user

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

## Analysis Endpoints
- POST /api/analyze (authenticated)
- GET /api/reports (authenticated)
- GET /api/reports/{{report_id}} (authenticated)
- DELETE /api/reports/{{report_id}} (authenticated)
"""
    
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(credentials_content)
    
    logger.info("Startup complete")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()