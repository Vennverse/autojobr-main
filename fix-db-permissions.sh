#!/bin/bash

# Generate the password again
DB_PASSWORD=$(openssl rand -hex 16)

# Fix PostgreSQL permissions completely
sudo -u postgres psql << SQL
-- Drop and recreate user with proper permissions
DROP USER IF EXISTS autojobr_user;
CREATE USER autojobr_user WITH PASSWORD '$DB_PASSWORD' CREATEDB;

-- Grant database permissions
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;

-- Connect to the database and grant schema permissions
\c autojobr

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO autojobr_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO autojobr_user;

-- Make user owner of the database
ALTER DATABASE autojobr OWNER TO autojobr_user;

\q
SQL

# Update the .env file with the new password
cat > .env << ENV
DATABASE_URL="postgresql://autojobr_user:$DB_PASSWORD@localhost:5432/autojobr"
SESSION_SECRET="$(openssl rand -hex 32)"
NODE_ENV="production"
PORT="5000"
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"
ENV

echo "Database permissions fixed. New password generated and saved to .env"
echo "Database password: $DB_PASSWORD"
