// Comprehensive AutoJobr Platform Testing Script
const https = require('https');
const fs = require('fs');

const API_BASE = 'https://0e44431a-708c-4df3-916b-4c2aa6aa0fdf-00-2xw51bgbvt8cp.spock.replit.dev';
const TEST_USER = {
  email: 'shubhamdubeyskd2001@gmail.com',
  password: 'autojobr123'
};

class AutoJobrTester {
  constructor() {
    this.sessionCookie = null;
    this.testResults = [];
    this.userProfile = null;
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${status}: ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, status, message });
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, API_BASE);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AutoJobr-Tester/1.0',
          ...options.headers
        }
      };

      if (this.sessionCookie) {
        requestOptions.headers.Cookie = this.sessionCookie;
      }

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          // Store session cookie
          if (res.headers['set-cookie']) {
            this.sessionCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
          }

          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: data, headers: res.headers });
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  async testLogin() {
    this.log('Starting login test...');
    try {
      const response = await this.makeRequest('/api/auth/email/login', {
        method: 'POST',
        body: TEST_USER
      });

      if (response.status === 200) {
        this.log('✅ Login successful', 'PASS');
        return true;
      } else {
        this.log(`❌ Login failed: ${response.status} - ${JSON.stringify(response.data)}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Login error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testUserProfile() {
    this.log('Testing user profile fetch...');
    try {
      const response = await this.makeRequest('/api/user');
      
      if (response.status === 200) {
        this.userProfile = response.data;
        this.log(`✅ Profile loaded: ${response.data.firstName} ${response.data.lastName} (${response.data.email})`, 'PASS');
        return true;
      } else {
        this.log(`❌ Profile fetch failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Profile error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testResumeData() {
    this.log('Testing resume data...');
    try {
      const response = await this.makeRequest('/api/resumes');
      
      if (response.status === 200) {
        const resumes = response.data;
        this.log(`✅ Found ${resumes.length} resumes`, 'PASS');
        
        if (resumes.length > 0) {
          const resume = resumes[0];
          this.log(`   Resume: ${resume.name} (Score: ${resume.ats_score || 'N/A'})`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Resume fetch failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Resume error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testJobPostings() {
    this.log('Testing job postings...');
    try {
      const response = await this.makeRequest('/api/jobs/postings');
      
      if (response.status === 200) {
        const jobs = response.data;
        this.log(`✅ Found ${jobs.length} job postings`, 'PASS');
        
        if (jobs.length > 0) {
          const job = jobs[0];
          this.log(`   Job: ${job.title} at ${job.company}`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Job postings failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Job postings error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testJobApplications() {
    this.log('Testing job applications...');
    try {
      const response = await this.makeRequest('/api/applications');
      
      if (response.status === 200) {
        const applications = response.data;
        this.log(`✅ Found ${applications.length} applications`, 'PASS');
        
        if (applications.length > 0) {
          const app = applications[0];
          this.log(`   Application: ${app.jobTitle} at ${app.company} (Status: ${app.status})`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Applications fetch failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Applications error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testJobRecommendations() {
    this.log('Testing AI job recommendations...');
    try {
      const response = await this.makeRequest('/api/jobs/recommendations');
      
      if (response.status === 200) {
        const recommendations = response.data;
        this.log(`✅ Found ${recommendations.length} job recommendations`, 'PASS');
        
        if (recommendations.length > 0) {
          const rec = recommendations[0];
          this.log(`   Recommendation: ${rec.title} (Match: ${rec.matchScore || 'N/A'}%)`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Recommendations failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Recommendations error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testSkillsData() {
    this.log('Testing skills data...');
    try {
      const response = await this.makeRequest('/api/skills');
      
      if (response.status === 200) {
        const skills = response.data;
        this.log(`✅ Found ${skills.length} skills`, 'PASS');
        
        if (skills.length > 0) {
          const skillNames = skills.slice(0, 5).map(s => s.name || s.skill).join(', ');
          this.log(`   Skills: ${skillNames}...`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Skills fetch failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Skills error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testWorkExperience() {
    this.log('Testing work experience...');
    try {
      const response = await this.makeRequest('/api/work-experience');
      
      if (response.status === 200) {
        const experience = response.data;
        this.log(`✅ Found ${experience.length} work experiences`, 'PASS');
        
        if (experience.length > 0) {
          const exp = experience[0];
          this.log(`   Experience: ${exp.jobTitle} at ${exp.company}`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Work experience failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Work experience error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testEducation() {
    this.log('Testing education data...');
    try {
      const response = await this.makeRequest('/api/education');
      
      if (response.status === 200) {
        const education = response.data;
        this.log(`✅ Found ${education.length} education records`, 'PASS');
        
        if (education.length > 0) {
          const edu = education[0];
          this.log(`   Education: ${edu.degree} from ${edu.institution}`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Education fetch failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Education error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testMockInterviewStats() {
    this.log('Testing mock interview stats...');
    try {
      const response = await this.makeRequest('/api/mock-interview/stats');
      
      if (response.status === 200) {
        const stats = response.data;
        this.log(`✅ Mock interview stats loaded`, 'PASS');
        this.log(`   Interviews taken: ${stats.totalInterviews || 0}`, 'INFO');
        return true;
      } else {
        this.log(`❌ Mock interview stats failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Mock interview error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testApplicationStats() {
    this.log('Testing application statistics...');
    try {
      const response = await this.makeRequest('/api/applications/stats');
      
      if (response.status === 200) {
        const stats = response.data;
        this.log(`✅ Application stats loaded`, 'PASS');
        this.log(`   Total applications: ${stats.totalApplications || 0}`, 'INFO');
        this.log(`   Interviews: ${stats.interviews || 0}`, 'INFO');
        return true;
      } else {
        this.log(`❌ Application stats failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Application stats error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testJobAnalyses() {
    this.log('Testing job analyses...');
    try {
      const response = await this.makeRequest('/api/jobs/analyses');
      
      if (response.status === 200) {
        const analyses = response.data;
        this.log(`✅ Found ${analyses.length} job analyses`, 'PASS');
        
        if (analyses.length > 0) {
          const analysis = analyses[0];
          this.log(`   Analysis: Match score ${analysis.matchScore || 'N/A'}%`, 'INFO');
        }
        return true;
      } else {
        this.log(`❌ Job analyses failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Job analyses error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testCoverLetterGeneration() {
    this.log('Testing AI cover letter generation...');
    try {
      const testJobDescription = "Software Engineer position at a tech company. Requires JavaScript, React, and Node.js experience.";
      const testCompanyName = "TechCorp Inc.";

      const response = await this.makeRequest('/api/generate-cover-letter', {
        method: 'POST',
        body: {
          jobDescription: testJobDescription,
          companyName: testCompanyName,
          useProfile: true
        }
      });

      if (response.status === 200) {
        const result = response.data;
        this.log(`✅ Cover letter generated (${result.coverLetter?.length || 0} chars)`, 'PASS');
        return true;
      } else {
        this.log(`❌ Cover letter generation failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Cover letter error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive AutoJobr platform testing...');
    this.log(`Testing against: ${API_BASE}`);
    this.log(`User: ${TEST_USER.email}`);
    this.log('='.repeat(60));

    const tests = [
      { name: 'Authentication', fn: () => this.testLogin() },
      { name: 'User Profile', fn: () => this.testUserProfile() },
      { name: 'Resume Data', fn: () => this.testResumeData() },
      { name: 'Job Postings', fn: () => this.testJobPostings() },
      { name: 'Job Applications', fn: () => this.testJobApplications() },
      { name: 'Job Recommendations', fn: () => this.testJobRecommendations() },
      { name: 'Skills Data', fn: () => this.testSkillsData() },
      { name: 'Work Experience', fn: () => this.testWorkExperience() },
      { name: 'Education Data', fn: () => this.testEducation() },
      { name: 'Mock Interview Stats', fn: () => this.testMockInterviewStats() },
      { name: 'Application Stats', fn: () => this.testApplicationStats() },
      { name: 'Job Analyses', fn: () => this.testJobAnalyses() },
      { name: 'AI Cover Letter', fn: () => this.testCoverLetterGeneration() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`\n📋 Running test: ${test.name}`);
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.log(`❌ Test ${test.name} threw error: ${error.message}`, 'ERROR');
        failed++;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.log('\n' + '='.repeat(60));
    this.log('🎯 TEST SUMMARY:');
    this.log(`✅ Passed: ${passed}`);
    this.log(`❌ Failed: ${failed}`);
    this.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

    // Generate detailed report
    this.generateReport();

    return { passed, failed, total: passed + failed };
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      apiBase: API_BASE,
      testUser: TEST_USER.email,
      userProfile: this.userProfile,
      results: this.testResults
    };

    fs.writeFileSync('test_results.json', JSON.stringify(report, null, 2));
    this.log('\n📄 Detailed test report saved to: test_results.json');
  }
}

// Run the tests
const tester = new AutoJobrTester();
tester.runAllTests().then(results => {
  console.log('\n🏁 Testing completed!');
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Testing failed:', error);
  process.exit(1);
});