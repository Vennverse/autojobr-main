-- Simple database fix SQL
ALTER USER autojobr_user WITH PASSWORD 'autojobr_2025_secure';
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
GRANT CONNECT ON DATABASE autojobr TO autojobr_user;