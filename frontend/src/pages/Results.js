import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { getScoreColor, getScoreStatus } from '../utils/helpers';
import { ArrowLeft, Download, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

const ScoreCircle = ({ score, label }) => {
  const color = getScoreColor(score);
  const status = getScoreStatus(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center" data-testid={`score-circle-${label.toLowerCase().replace(' ', '-')}`}>
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="#e4e4e7"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            {score}
          </span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-600 mt-1" style={{ color }}>{status}</p>
      </div>
    </div>
  );
};

const Results = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports/${reportId}`,
        { withCredentials: true }
      );
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleExportPDF = async () => {
    toast.info('Generating PDF...');
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`hiresignal-report-${reportId}.pdf`);
    toast.success('PDF downloaded!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-zinc-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const analysis = report.analysis;

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-black" data-testid="back-to-reports-link">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
          <Button onClick={handleExportPDF} variant="outline" className="gap-2" data-testid="export-pdf-button">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <div id="report-content" className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-8" data-testid="scores-section">
            <h1
              className="text-3xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Resume Analysis Results
            </h1>
            <p className="text-zinc-600 mb-8">
              {report.company_name && `${report.company_name} - `}
              {report.role_title || 'General Analysis'}
            </p>

            <div className="grid md:grid-cols-2 gap-12 mb-8">
              <ScoreCircle score={report.ats_score} label="ATS Score" />
              <ScoreCircle score={report.recruiter_score} label="Recruiter Score" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-50 rounded-lg p-4" data-testid="ats-explanation">
                <h3 className="font-semibold mb-2">ATS Analysis</h3>
                <p className="text-sm text-zinc-700 leading-relaxed">{analysis.ats_explanation}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4" data-testid="recruiter-explanation">
                <h3 className="font-semibold mb-2">Recruiter Perspective</h3>
                <p className="text-sm text-zinc-700 leading-relaxed">{analysis.recruiter_explanation}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="ai-tone" className="w-full" data-testid="analysis-tabs">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ai-tone" data-testid="tab-ai-tone">AI Tone</TabsTrigger>
              <TabsTrigger value="keywords" data-testid="tab-keywords">Keywords</TabsTrigger>
              <TabsTrigger value="feedback" data-testid="tab-feedback">Feedback</TabsTrigger>
              <TabsTrigger value="rewrites" data-testid="tab-rewrites">Rewrites</TabsTrigger>
              <TabsTrigger value="action-plan" data-testid="tab-action-plan">Action Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="ai-tone" className="mt-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-6" data-testid="ai-tone-section">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  AI/Robotic Tone Detection
                </h2>

                <div className="flex items-start gap-3 mb-6">
                  {analysis.ai_tone_detection?.has_ai_tone ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-1" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-1" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {analysis.ai_tone_detection?.has_ai_tone
                        ? 'AI-Generated Content Detected'
                        : 'Natural Tone - Looks Good!'}
                    </p>
                    <p className="text-sm text-zinc-600">
                      Confidence: {analysis.ai_tone_detection?.confidence || 'N/A'}
                    </p>
                  </div>
                </div>

                {analysis.ai_tone_detection?.issues?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Issues Found:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.ai_tone_detection.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-zinc-700">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.ai_tone_detection?.examples?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Robotic Phrases:</h3>
                    <div className="space-y-2">
                      {analysis.ai_tone_detection.examples.map((example, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                          "{example}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.ai_tone_detection?.suggestions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">How to Fix:</h3>
                    <ul className="space-y-2">
                      {analysis.ai_tone_detection.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="mt-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-6" data-testid="keywords-section">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  Keyword Analysis
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-emerald-600">Matched Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyword_match?.matched_keywords?.map((keyword, idx) => (
                        <span key={idx} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-red-600">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyword_match?.missing_keywords?.map((keyword, idx) => (
                        <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-orange-600">Missing Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyword_match?.missing_technical_skills?.map((skill, idx) => (
                        <span key={idx} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-blue-600">Missing Soft Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyword_match?.missing_soft_skills?.map((skill, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-6" data-testid="feedback-section">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  Recruiter Feedback
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">First Impression</h3>
                    <p className="text-zinc-700 leading-relaxed">{analysis.recruiter_feedback?.first_impression}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2 text-emerald-600">Strengths</h3>
                      <ul className="space-y-2">
                        {analysis.recruiter_feedback?.strengths?.map((strength, idx) => (
                          <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 text-red-600">Weaknesses</h3>
                      <ul className="space-y-2">
                        {analysis.recruiter_feedback?.weaknesses?.map((weakness, idx) => (
                          <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Standout Factor</h3>
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      {analysis.recruiter_feedback?.standout_factor}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rewrites" className="mt-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-6" data-testid="rewrites-section">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  Bullet Point Improvements
                </h2>

                <div className="space-y-6">
                  {analysis.bullet_rewrites?.map((rewrite, idx) => (
                    <div key={idx} className="border border-zinc-200 rounded-lg p-4">
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-red-600">Original</h4>
                        </div>
                        <p className="text-sm text-zinc-700 bg-red-50 border border-red-200 rounded p-3">
                          {rewrite.original}
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-orange-600 mb-2">Issue</h4>
                        <p className="text-sm text-zinc-700">{rewrite.issue}</p>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-emerald-600">Improved</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(rewrite.improved)}
                            className="gap-2"
                            data-testid={`copy-bullet-${idx}`}
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm text-zinc-700 bg-emerald-50 border border-emerald-200 rounded p-3">
                          {rewrite.improved}
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <h4 className="text-sm font-semibold text-blue-600 mb-1">Impact</h4>
                        <p className="text-sm text-zinc-700">{rewrite.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {analysis.missing_content && (
                  <div className="mt-6 border-t border-zinc-200 pt-6">
                    <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                      Missing Content Suggestions
                    </h3>

                    {analysis.missing_content.sections_to_add?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Sections to Add:</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missing_content.sections_to_add.map((section, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                              {section}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.missing_content.content_suggestions?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Content Suggestions:</h4>
                        <ul className="space-y-2">
                          {analysis.missing_content.content_suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="action-plan" className="mt-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-6" data-testid="action-plan-section">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  Your Action Plan
                </h2>

                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-3">Fix Immediately</h3>
                    <ul className="space-y-2">
                      {analysis.action_plan?.fix_immediately?.map((item, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                          <span className="text-red-500 font-bold mt-1">1.</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-3">Improve Next</h3>
                    <ul className="space-y-2">
                      {analysis.action_plan?.improve_next?.map((item, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                          <span className="text-orange-500 font-bold mt-1">2.</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-zinc-100 border border-zinc-300 rounded-lg p-4">
                    <h3 className="font-semibold text-zinc-800 mb-3">Optional Polish</h3>
                    <ul className="space-y-2">
                      {analysis.action_plan?.optional_polish?.map((item, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                          <span className="text-zinc-500 font-bold mt-1">3.</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h3 className="font-semibold text-emerald-800 mb-3">Top 3 Changes for Maximum Impact</h3>
                    <ol className="space-y-3">
                      {analysis.action_plan?.top_3_changes?.map((change, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          {change}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Results;