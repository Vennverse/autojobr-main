
#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// List of random castes to assign
const castes = [
  'General',
  'OBC',
  'SC',
  'ST',
  'EWS'
];

// Users to update
const usersToUpdate = [
  'emma.google@autojobr.com',
  'liam.meta@autojobr.com',
  'olivia.apple@autojobr.com',
  'noah.amazon@autojobr.com',
  'ava.microsoft@autojobr.com',
  'ethan.netflix@autojobr.com',
  'mia.uber@autojobr.com',
  'lucas.x(twitter)@autojobr.com',
  'sophia.linkedin@autojobr.com',
  'jack.tesla@autojobr.com'
];

function getRandomCaste() {
  return castes[Math.floor(Math.random() * castes.length)];
}

async function updateUserCastes() {
  try {
    console.log('🔄 Starting caste update for users...\n');

    for (const email of usersToUpdate) {
      const randomCaste = getRandomCaste();
      
      // Update user's caste in user_profiles table
      const result = await pool.query(
        `UPDATE user_profiles 
         SET caste = $1, updated_at = NOW()
         WHERE user_id IN (SELECT id FROM users WHERE email = $2)
         RETURNING user_id, caste`,
        [randomCaste, email]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Updated ${email} → Caste: ${randomCaste}`);
      } else {
        console.log(`⚠️  No profile found for ${email}, creating one...`);
        
        // Get user_id
        const userResult = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );
        
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;
          
          // Create profile with caste
          await pool.query(
            `INSERT INTO user_profiles (user_id, caste, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT (user_id) DO UPDATE SET caste = $2, updated_at = NOW()`,
            [userId, randomCaste]
          );
          
          console.log(`✅ Created profile for ${email} → Caste: ${randomCaste}`);
        } else {
          console.log(`❌ User not found: ${email}`);
        }
      }
    }

    console.log('\n✅ All users updated successfully!');
    
    // Verify updates
    console.log('\n📊 Verification - Current caste assignments:');
    const verification = await pool.query(
      `SELECT u.email, up.caste 
       FROM users u
       JOIN user_profiles up ON u.id = up.user_id
       WHERE u.email = ANY($1)
       ORDER BY u.email`,
      [usersToUpdate]
    );
    
    verification.rows.forEach(row => {
      console.log(`   ${row.email}: ${row.caste}`);
    });

  } catch (error) {
    console.error('❌ Error updating castes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateUserCastes();
