export function formatApiErrorDetail(detail) {
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
}

export function getScoreColor(score) {
  if (score >= 85) return '#10B981';
  if (score >= 70) return '#F59E0B';
  if (score >= 50) return '#F97316';
  return '#EF4444';
}

export function getScoreStatus(score) {
  if (score >= 85) return 'Strong Match';
  if (score >= 70) return 'Good but Needs Improvement';
  if (score >= 50) return 'Risky';
  return 'Weak Match';
}