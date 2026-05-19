import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { getScoreColor, getScoreStatus } from '../utils/helpers';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports`,
        { withCredentials: true }
      );
      setReports(data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports/${reportId}`,
        { withCredentials: true }
      );
      setReports(reports.filter(r => r._id !== reportId));
      toast.success('Report deleted');
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-zinc-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-4xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              data-testid="reports-title"
            >
              My Reports
            </h1>
            <p className="text-zinc-600">View and manage your resume analysis reports</p>
          </div>
          <Link to="/dashboard" data-testid="new-analysis-button">
            <Button className="bg-black text-white hover:bg-zinc-800">
              New Analysis
            </Button>
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center" data-testid="empty-state">
            <FileText className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
            <p className="text-zinc-600 mb-6">Create your first resume analysis to get started</p>
            <Link to="/dashboard">
              <Button className="bg-black text-white hover:bg-zinc-800">
                Analyze Resume
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                data-testid={`report-card-${report._id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                      {report.company_name || 'General Analysis'}
                      {report.role_title && ` - ${report.role_title}`}
                    </h3>
                    <p className="text-sm text-zinc-600 mb-4">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-xs text-zinc-600 uppercase tracking-wider">ATS Score</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold" style={{ color: getScoreColor(report.ats_score) }}>
                            {report.ats_score}
                          </span>
                          <span className="text-xs text-zinc-600">{getScoreStatus(report.ats_score)}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-zinc-600 uppercase tracking-wider">Recruiter Score</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold" style={{ color: getScoreColor(report.recruiter_score) }}>
                            {report.recruiter_score}
                          </span>
                          <span className="text-xs text-zinc-600">{getScoreStatus(report.recruiter_score)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/results/${report._id}`} data-testid={`view-report-${report._id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-report-${report._id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;