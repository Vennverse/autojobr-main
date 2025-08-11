#!/bin/bash

# Function to create a job posting
create_job() {
  local title="$1"
  local company="$2"
  local location="$3"
  local workMode="$4"
  local jobType="$5"
  local experienceLevel="$6"
  local minSalary="$7"
  local maxSalary="$8"
  local description="$9"
  local requirements="${10}"
  local responsibilities="${11}"
  local benefits="${12}"
  
  curl -X POST http://localhost:5000/api/recruiter/jobs \
    -H "Content-Type: application/json" \
    -b /tmp/cookies.txt \
    -d "{
      \"title\": \"$title\",
      \"companyName\": \"$company\",
      \"location\": \"$location\",
      \"workMode\": \"$workMode\",
      \"jobType\": \"$jobType\",
      \"experienceLevel\": \"$experienceLevel\",
      \"minSalary\": $minSalary,
      \"maxSalary\": $maxSalary,
      \"description\": \"$description\",
      \"requirements\": \"$requirements\",
      \"responsibilities\": \"$responsibilities\",
      \"benefits\": \"$benefits\",
      \"skills\": [\"React\", \"Node.js\", \"TypeScript\"]
    }" \
    -s | jq -r '.message // .error // "Success"'
}

echo "Creating 50+ detailed job postings..."

# Software Engineering Jobs
create_job "Senior Full Stack Developer" "TechVision Solutions" "San Francisco, CA" "hybrid" "full-time" "senior" 120000 180000 \
"We are seeking a highly skilled Senior Full Stack Developer to join our innovative team. You will be responsible for developing and maintaining web applications using modern technologies including React, Node.js, and cloud platforms." \
"5+ years of experience in full stack development. Proficiency in React, Node.js, TypeScript. Experience with AWS or Azure cloud platforms. Strong understanding of databases (SQL and NoSQL). Knowledge of microservices architecture. Experience with CI/CD pipelines" \
"Design and develop scalable web applications. Collaborate with cross-functional teams. Mentor junior developers. Participate in code reviews and technical discussions. Implement best practices for security and performance" \
"Competitive salary and equity package. Health, dental, and vision insurance. 401(k) with company matching. Flexible PTO policy. Remote work options. Professional development budget"

create_job "DevOps Engineer" "CloudFirst Inc" "Austin, TX" "remote" "full-time" "mid" 90000 140000 \
"Join our DevOps team to build and maintain robust infrastructure that supports our rapidly growing platform. You'll work with cutting-edge technologies and help shape our deployment strategies." \
"3+ years of DevOps or infrastructure experience. Proficiency with Kubernetes and Docker. Experience with CI/CD tools (Jenkins, GitLab CI). Knowledge of Infrastructure as Code (Terraform, Ansible). Cloud platform experience (AWS, GCP, Azure). Strong scripting skills (Python, Bash)" \
"Design and implement automated deployment pipelines. Manage containerized applications using Kubernetes. Monitor system performance and reliability. Implement security best practices. Collaborate with development teams on infrastructure needs" \
"Remote-first culture. Comprehensive health benefits. Stock options. Learning and development stipend. Home office setup allowance"

create_job "Frontend React Developer" "Digital Dynamics" "New York, NY" "onsite" "full-time" "mid" 85000 125000 \
"We're looking for a passionate Frontend Developer to create exceptional user experiences. You'll work on modern React applications that serve millions of users worldwide." \
"3+ years of React development experience. Strong proficiency in JavaScript/TypeScript. Experience with state management (Redux, Context API). Knowledge of modern CSS frameworks (Tailwind, Styled Components). Understanding of responsive design principles. Experience with testing frameworks (Jest, React Testing Library)" \
"Develop responsive and interactive user interfaces. Collaborate with UX/UI designers. Optimize applications for performance. Write comprehensive tests. Participate in agile development processes" \
"Competitive salary. Health and wellness benefits. Catered lunches. Professional development opportunities. Flexible working hours"

echo "Created first 3 jobs. Creating more..."

