-- Critical performance indexes for slow queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_user_id_created ON resumes(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_applicant_applied ON job_posting_applications(applicant_id, applied_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_posting ON job_posting_applications(job_posting_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_active ON job_postings(is_active) WHERE is_active = true;

-- Analyze tables for query planner
ANALYZE resumes;
ANALYZE job_posting_applications;
ANALYZE job_postings;
