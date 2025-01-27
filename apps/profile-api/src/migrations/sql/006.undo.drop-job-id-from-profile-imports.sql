-- Add job_id column back to profile_imports table
ALTER TABLE profile_imports ADD COLUMN job_id UUID; 