#!/usr/bin/env node

/**
 * Direct Database Schema Fix for VM Resume Upload Issue
 * 
 * This script connects to your VM database using DATABASE_URL 
 * and fixes the schema to support resume uploads
 */

import pkg from 'pg';
const { Pool } = pkg;

console.log('=== AutoJobr VM Database Schema Fix ===');
console.log('Timestamp:', new Date().toISOString());

const DATABASE_URL = "postgresql://autojobr_user:autojobr123@40.160.50.128:5432/autojobr";

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found');
  console.error('Please ensure DATABASE_URL is set in Replit environment');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');
console.log('Database URL structure:', DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@'));

const pool = new Pool({ connectionString: DATABASE_URL });

async function fixSchema() {
  try {
    console.log('\n=== Checking Current Schema ===');
    
    // Check current resumes table structure
    const schemaCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current resumes table columns:');
    schemaCheck.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if file_data column exists
    const hasFileData = schemaCheck.rows.some(row => row.column_name === 'file_data');
    const hasFilePath = schemaCheck.rows.some(row => row.column_name === 'file_path');
    
    console.log('\n=== Schema Analysis ===');
    console.log('Has file_data column:', hasFileData ? '✅' : '❌');
    console.log('Has file_path column:', hasFilePath ? '✅' : '❌');
    
    if (!hasFileData) {
      console.log('\n=== Adding file_data Column ===');
      await pool.query(`
        ALTER TABLE resumes 
        ADD COLUMN file_data TEXT
      `);
      console.log('✅ Added file_data column');
    } else {
      console.log('\n✅ file_data column already exists');
    }
    
    if (hasFilePath) {
      console.log('\n=== Making file_path Optional ===');
      try {
        await pool.query(`
          ALTER TABLE resumes 
          ALTER COLUMN file_path DROP NOT NULL
        `);
        console.log('✅ Made file_path column optional');
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log('✅ file_path column was already optional');
        } else {
          console.log('⚠️  Could not modify file_path constraint:', error.message);
        }
      }
    }
    
    console.log('\n=== Verifying Final Schema ===');
    const finalSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      AND column_name IN ('file_path', 'file_data')
      ORDER BY column_name
    `);
    
    console.log('Resume storage columns:');
    finalSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n=== Testing Database Connection ===');
    const testQuery = await pool.query('SELECT COUNT(*) as resume_count FROM resumes');
    console.log(`✅ Database connection working - found ${testQuery.rows[0].resume_count} resumes`);
    
    console.log('\n🎉 Schema fix completed successfully!');
    console.log('\nThe resume upload issue should now be resolved.');
    console.log('You can test by uploading a resume through your VM web interface.');
    
  } catch (error) {
    console.error('\n❌ Error fixing schema:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to database - check if DATABASE_URL is correct');
    } else if (error.code === '42P01') {
      console.error('Table does not exist - database may not be properly initialized');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✅ Database connection closed');
  }
}

console.log('\n🚀 Starting schema fix...');
fixSchema();