-- Add networking contacts table
CREATE TABLE IF NOT EXISTS networking_contacts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  full_name TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  notes TEXT,
  tags TEXT[],
  last_contacted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_networking_contacts_user ON networking_contacts(user_id);
CREATE INDEX idx_networking_contacts_company ON networking_contacts(company);
