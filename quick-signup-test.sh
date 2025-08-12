#!/bin/bash

echo "🧪 Testing Signup Functionality"

cd ~/autojobr-main

# Test signup with proper data
echo "Testing signup endpoint..."

curl -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser'$(date +%s)'@example.com",
    "password": "password123",
    "user_type": "job_seeker",
    "firstName": "Test",
    "lastName": "User"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "Checking application logs for errors..."
pm2 logs autojobr --lines 10

echo ""
echo "Application status:"
pm2 status autojobr