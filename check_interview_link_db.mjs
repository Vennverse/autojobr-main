
```javascript
#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

async function checkDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('═'.repeat(60));
    console.log('🗄️  Database Interview Link Flow Check');
    console.log('═'.repeat(60));

    // Check interview link
    console.log('\n📋 Checking interview link...');
    const linkResult = await pool.query(`
      SELECT * FROM interview_links 
      WHERE link_id = 'link_1759692765804_yfm8zjth0'
    `);
    
    if (linkResult.rows.length > 0) {
      const link = linkResult.rows[0];
      console.log('✅ Interview link found:');
      console.log('   - ID:', link.id);
      console.log('   - Type:', link.interview_type);
      console.log('   - Job Posting ID:', link.job_posting_id);
      console.log('   - Recruiter ID:', link.recruiter_id);
      console.log('   - Expires:', link.expires_at);
      console.log('   - Interview Data:', link.interview_data);

      // Check if job posting exists
      if (link.job_posting_id) {
        console.log('\n🏢 Checking job posting...');
        const jobResult = await pool.query(`
          SELECT id, title, company_name FROM job_postings 
          WHERE id = $1
        `, [link.job_posting_id]);
        
        if (jobResult.rows.length > 0) {
          console.log('✅ Job posting found:', jobResult.rows[0].title);
        } else {
          console.log('❌ Job posting not found!');
        }

        // Check applications for test user
        console.log('\n📝 Checking applications for test user...');
        const appResult = await pool.query(`
          SELECT * FROM job_posting_applications 
          WHERE job_posting_id = $1 
          AND job_seeker_id IN (
            SELECT id FROM users WHERE email = 'shubhamdubexskd2001@gmail.com'
          )
        `, [link.job_posting_id]);
        
        if (appResult.rows.length > 0) {
          console.log('✅ Application found:');
          appResult.rows.forEach(app => {
            console.log('   - ID:', app.id);
            console.log('   - Status:', app.status);
            console.log('   - Source:', app.source);
            console.log('   - Applied At:', app.applied_at);
          });
        } else {
          console.log('ℹ️  No application found (will be created on link access)');
        }
      }

      // Check for existing assignments
      console.log('\n🎯 Checking existing assignments...');
      
      const userResult = await pool.query(`
        SELECT id FROM users WHERE email = 'shubhamdubexskd2001@gmail.com'
      `);
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        // Check virtual interviews
        const virtualResult = await pool.query(`
          SELECT * FROM virtual_interviews 
          WHERE user_id = $1 AND assigned_by = $2
          ORDER BY created_at DESC LIMIT 5
        `, [userId, link.recruiter_id]);
        
        console.log(`   - Virtual interviews: ${virtualResult.rows.length}`);
        
        // Check mock interviews
        const mockResult = await pool.query(`
          SELECT * FROM mock_interviews 
          WHERE user_id = $1 AND assigned_by = $2
          ORDER BY created_at DESC LIMIT 5
        `, [userId, link.recruiter_id]);
        
        console.log(`   - Mock interviews: ${mockResult.rows.length}`);
        
        // Check test assignments
        const testResult = await pool.query(`
          SELECT * FROM test_assignments 
          WHERE job_seeker_id = $1 AND recruiter_id = $2
          ORDER BY assigned_at DESC LIMIT 5
        `, [userId, link.recruiter_id]);
        
        console.log(`   - Test assignments: ${testResult.rows.length}`);
      }

    } else {
      console.log('❌ Interview link not found in database!');
    }

    console.log('\n═'.repeat(60));
    console.log('✅ Database check completed!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase().catch(console.error);
```
