import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatApiErrorDetail } from '../utils/helpers';
import { Sparkles, Loader2 } from 'lucide-react';
import AnalysisProgress from '../components/AnalysisProgress';

const Dashboard = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level');
  const [tonePreference, setTonePreference] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAnalysisStep(1);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < 7) return prev + 1;
        return prev;
      });
    }, 2000);

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/analyze`,
        {
          resume_text: resumeText,
          job_description: jobDescription,
          company_name: companyName || null,
          role_title: roleTitle || null,
          experience_level: experienceLevel,
          tone_preference: tonePreference
        },
        { withCredentials: true }
      );

      clearInterval(progressInterval);
      setAnalysisStep(8);
      setTimeout(() => {
        navigate(`/results/${data.id}`);
      }, 1000);
    } catch (err) {
      clearInterval(progressInterval);
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
      setLoading(false);
      setAnalysisStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-3"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            data-testid="dashboard-title"
          >
            Resume Analysis
          </h1>
          <p className="text-lg text-zinc-600">
            Paste your resume and job description to get AI-powered insights and suggestions
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6" data-testid="analysis-error">
            {error}
          </div>
        )}

        {loading && analysisStep > 0 ? (
          <AnalysisProgress currentStep={analysisStep} />
        ) : (
          <form onSubmit={handleAnalyze} className="space-y-6" data-testid="analysis-form">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <Label htmlFor="resume" className="text-base font-semibold mb-2 block">
                Your Resume *
              </Label>
              <Textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                required
                rows={15}
                className="resize-none font-mono text-sm"
                placeholder="Paste your resume text here..."
                data-testid="resume-input"
              />
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <Label htmlFor="job-description" className="text-base font-semibold mb-2 block">
                Job Description *
              </Label>
              <Textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={15}
                className="resize-none font-mono text-sm"
                placeholder="Paste the job description here..."
                data-testid="job-description-input"
              />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Optional Details
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Amazon"
                  className="mt-1"
                  data-testid="company-name-input"
                />
              </div>

              <div>
                <Label htmlFor="role-title">Target Role Title</Label>
                <Input
                  id="role-title"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="mt-1"
                  data-testid="role-title-input"
                />
              </div>

              <div>
                <Label htmlFor="experience-level">Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger className="mt-1" id="experience-level" data-testid="experience-level-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Entry-Level">Entry-Level</SelectItem>
                    <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tone-preference">Tone Preference</Label>
                <Select value={tonePreference} onValueChange={setTonePreference}>
                  <SelectTrigger className="mt-1" id="tone-preference" data-testid="tone-preference-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Confident">Confident</SelectItem>
                    <SelectItem value="Natural">Natural</SelectItem>
                    <SelectItem value="Concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !resumeText || !jobDescription}
              size="lg"
              className="bg-black text-white hover:bg-zinc-800 gap-2 px-8"
              data-testid="analyze-button"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Run ATS + Recruiter Analysis
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Dashboard;