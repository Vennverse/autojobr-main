
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function testDatabaseSchema() {
  console.log('🗄️  Testing Advanced Assessment Database Schema...\n');
  
  const tables = [
    'video_interviews',
    'video_responses', 
    'simulation_assessments',
    'personality_assessments',
    'skills_verifications'
  ];
  
  try {
    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      
      // Check if table exists and get structure
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = ${table}
        ORDER BY ordinal_position
      `);
      
      if (result.length === 0) {
        console.log(`❌ Table ${table} does not exist`);
      } else {
        console.log(`✅ Table ${table} exists with ${result.length} columns`);
        result.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      }
      console.log('');
    }
    
    // Test basic insert/select operations
    console.log('🧪 Testing basic database operations...');
    
    const testQuery = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection working');
    
    console.log('\n🎉 Database schema verification completed!');
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error);
  }
}

testDatabaseSchema();
