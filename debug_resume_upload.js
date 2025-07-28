#!/usr/bin/env node

/**
 * Resume Upload Debug Script for VM Deployment
 * 
 * This script helps debug resume upload issues on VM deployments
 * Run this on your VM to check various components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== AutoJobr Resume Upload Debug Tool ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Platform:', process.platform);
console.log('Node Version:', process.version);
console.log('Current Directory:', process.cwd());
console.log('Script Directory:', __dirname);
console.log('Timestamp:', new Date().toISOString());
console.log('');

// Check environment variables
console.log('=== Environment Variables Check ===');
const requiredEnvVars = [
  'DATABASE_URL',
  'GROQ_API_KEY', 
  'RESEND_API_KEY'
];

const optionalEnvVars = [
  'NODE_ENV',
  'PORT',
  'STRIPE_SECRET_KEY',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET'
];

console.log('Required Environment Variables:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`  ${envVar}: ${value ? '✓ SET' : '✗ MISSING'}`);
  if (value && envVar === 'DATABASE_URL') {
    // Mask sensitive info but show structure
    const maskedUrl = value.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
    console.log(`    Structure: ${maskedUrl}`);
  }
});

console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`  ${envVar}: ${value ? '✓ SET' : '- not set'}`);
});

console.log('');

// Check file system permissions
console.log('=== File System Check ===');
const checkPaths = [
  './server',
  './client', 
  './shared',
  './node_modules',
  './package.json',
  './server/routes.ts',
  './server/storage.ts',
  './shared/schema.ts'
];

checkPaths.forEach(checkPath => {
  try {
    const stats = fs.statSync(checkPath);
    const type = stats.isDirectory() ? 'DIR' : 'FILE';
    const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)}KB)` : '';
    console.log(`  ${checkPath}: ✓ EXISTS (${type})${size}`);
  } catch (error) {
    console.log(`  ${checkPath}: ✗ MISSING or NO ACCESS`);
  }
});

console.log('');

// Check package.json and dependencies
console.log('=== Package Dependencies Check ===');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('Package name:', packageJson.name);
  console.log('Package version:', packageJson.version);
  
  const criticalDeps = [
    'express',
    'multer', 
    'drizzle-orm',
    '@neondatabase/serverless',
    'groq-sdk',
    'resend'
  ];
  
  console.log('\nCritical Dependencies:');
  criticalDeps.forEach(dep => {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    console.log(`  ${dep}: ${version ? `✓ ${version}` : '✗ MISSING'}`);
  });
} catch (error) {
  console.log('✗ Error reading package.json:', error.message);
}

console.log('');

// Check multer and upload configuration
console.log('=== Multer Configuration Check ===');
try {
  // Test multer import
  const multer = await import('multer');
  console.log('✓ Multer import successful');
  
  // Test multer memory storage
  const storage = multer.default.memoryStorage();
  console.log('✓ Multer memory storage created');
  
  // Test upload configuration
  const upload = multer.default({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      cb(null, allowedTypes.includes(file.mimetype));
    }
  });
  console.log('✓ Multer upload configuration created');
  
} catch (error) {
  console.log('✗ Multer configuration error:', error.message);
}

console.log('');

// Check database connection
console.log('=== Database Connection Check ===');
try {
  if (!process.env.DATABASE_URL) {
    console.log('✗ DATABASE_URL not set');
  } else {
    // Test database import
    const { Pool } = await import('@neondatabase/serverless');
    console.log('✓ Neon serverless import successful');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log('✓ Database pool created');
    
    // Test basic query
    try {
      const result = await pool.query('SELECT 1 as test');
      console.log('✓ Database connection test successful');
      console.log('  Test query result:', result.rows[0]);
    } catch (queryError) {
      console.log('✗ Database query failed:', queryError.message);
    }
    
    await pool.end();
    console.log('✓ Database pool closed');
  }
} catch (error) {
  console.log('✗ Database connection error:', error.message);
}

console.log('');

// Check Groq API
console.log('=== Groq API Check ===');
try {
  if (!process.env.GROQ_API_KEY) {
    console.log('✗ GROQ_API_KEY not set');
  } else {
    const Groq = await import('groq-sdk');
    console.log('✓ Groq SDK import successful');
    
    const groq = new Groq.default({
      apiKey: process.env.GROQ_API_KEY
    });
    console.log('✓ Groq client created');
    
    // Test simple API call
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Say "API test successful"' }],
        model: 'llama-3.1-8b-instant',
        max_tokens: 10
      });
      console.log('✓ Groq API test successful');
      console.log('  Response:', completion.choices[0]?.message?.content);
    } catch (apiError) {
      console.log('✗ Groq API call failed:', apiError.message);
    }
  }
} catch (error) {
  console.log('✗ Groq setup error:', error.message);
}

console.log('');

// Check server file structure
console.log('=== Server File Structure Check ===');
const serverFiles = [
  './server/index.ts',
  './server/routes.ts', 
  './server/storage.ts',
  './server/auth.ts',
  './server/groqService.ts',
  './server/db.ts'
];

serverFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;
    console.log(`  ${file}: ✓ EXISTS (${lines} lines, ${(content.length / 1024).toFixed(1)}KB)`);
    
    // Check for specific patterns in routes.ts
    if (file === './server/routes.ts') {
      const hasResumeUpload = content.includes("app.post('/api/resumes/upload'");
      const hasMulter = content.includes('upload.single(');
      const hasAuthentication = content.includes('isAuthenticated');
      
      console.log(`    Resume upload route: ${hasResumeUpload ? '✓' : '✗'}`);
      console.log(`    Multer middleware: ${hasMulter ? '✓' : '✗'}`);
      console.log(`    Authentication: ${hasAuthentication ? '✓' : '✗'}`);
    }
  } catch (error) {
    console.log(`  ${file}: ✗ ERROR - ${error.message}`);
  }
});

console.log('');

// Memory and system check
console.log('=== System Resources Check ===');
const memUsage = process.memoryUsage();
console.log('Memory Usage:');
console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);

// Disk space check for current directory
try {
  const stats = fs.statSync('.');
  console.log('Current directory accessible: ✓');
} catch (error) {
  console.log('Current directory issue: ✗', error.message);
}

console.log('');
console.log('=== Debug Summary ===');
console.log('Run this script on your VM with: node debug_resume_upload.js');
console.log('If any checks fail, those are likely the root cause of upload issues.');
console.log('');
console.log('Common VM deployment issues:');
console.log('1. Missing environment variables');
console.log('2. File permission issues');
console.log('3. Database connection problems');
console.log('4. Memory/disk space limitations');
console.log('5. Missing dependencies after deployment');
console.log('');
console.log('Next steps:');
console.log('1. Fix any ✗ errors shown above');
console.log('2. Check your PM2 logs: pm2 logs autojobr');
console.log('3. Check nginx error logs: sudo tail -f /var/log/nginx/error.log');
console.log('4. Test resume upload again');
console.log('');
console.log('=== End Debug Report ===');