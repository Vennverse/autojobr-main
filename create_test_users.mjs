#!/usr/bin/env tsx

import bcrypt from 'bcryptjs';
import { db } from './server/db.ts';
import { storage } from './server/storage.ts';
import { users, userProfiles } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Configuration
const BATCH_SIZE = 3; // Process users in small batches to avoid timeouts
const SALT_ROUNDS = 12; // Use high salt rounds for security
const PASSWORD = 'password123';

// Test users to create
const TEST_USERS = [
  { email: 'emma.google@autojobr.com', firstName: 'Emma', lastName: 'Google' },
  { email: 'liam.meta@autojobr.com', firstName: 'Liam', lastName: 'Meta' },
  { email: 'olivia.apple@autojobr.com', firstName: 'Olivia', lastName: 'Apple' },
  { email: 'noah.amazon@autojobr.com', firstName: 'Noah', lastName: 'Amazon' },
  { email: 'ava.microsoft@autojobr.com', firstName: 'Ava', lastName: 'Microsoft' },
  { email: 'ethan.netflix@autojobr.com', firstName: 'Ethan', lastName: 'Netflix' },
  { email: 'mia.uber@autojobr.com', firstName: 'Mia', lastName: 'Uber' },
  { email: 'lucas.x(twitter)@autojobr.com', firstName: 'Lucas', lastName: 'X' },
  { email: 'sophia.linkedin@autojobr.com', firstName: 'Sophia', lastName: 'LinkedIn' },
  { email: 'jack.tesla@autojobr.com', firstName: 'Jack', lastName: 'Tesla' }
];

// Utility function to generate unique user ID
function generateUserId() {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function to delay execution (for batch processing)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if user already exists
async function userExists(email) {
  try {
    console.log(`🔍 Checking if user exists: ${email}`);
    const existingUser = await storage.getUserByEmail(email);
    return !!existingUser;
  } catch (error) {
    console.error(`❌ Error checking user existence for ${email}:`, error.message);
    return false;
  }
}

// Create a single user with profile
async function createUserWithProfile(userData) {
  const { email, firstName, lastName } = userData;
  
  try {
    console.log(`🚀 Creating user: ${email}`);
    
    // Hash the password securely
    console.log(`🔐 Hashing password for ${email}...`);
    const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    
    // Generate unique user ID
    const userId = generateUserId();
    
    // Create user data object
    const newUser = {
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      userType: 'job_seeker',
      currentRole: 'job_seeker',
      availableRoles: 'job_seeker',
      emailVerified: true,
      freeRankingTestsRemaining: 1,
      planType: 'free',
      subscriptionStatus: 'free',
      aiModelTier: 'premium',
      hasUsedPremiumTrial: false
    };
    
    // Create the user in database
    console.log(`💾 Saving user to database: ${email}`);
    const createdUser = await storage.upsertUser(newUser);
    console.log(`✅ User created successfully: ${email} (ID: ${userId})`);
    
    // Create user profile
    console.log(`👤 Creating user profile for: ${email}`);
    const profileData = {
      userId: userId,
      fullName: `${firstName} ${lastName}`,
      freeRankingTestsRemaining: 1,
      freeInterviewsRemaining: 5,
      premiumInterviewsRemaining: 50,
      totalInterviewsUsed: 0,
      totalRankingTestsUsed: 0,
      onboardingCompleted: false,
      profileCompletion: 25,
      // Set some basic profile fields
      professionalTitle: 'Software Engineer',
      location: 'Remote',
      workAuthorization: 'citizen',
      requiresSponsorship: false,
      preferredWorkMode: 'remote',
      currentlyEmployed: true,
      canContactCurrentEmployer: true,
      yearsExperience: 3,
      preferredStartDate: 'flexible',
      backgroundCheckConsent: true
    };
    
    const createdProfile = await storage.upsertUserProfile(profileData);
    console.log(`✅ User profile created successfully for: ${email}`);
    
    return {
      user: createdUser,
      profile: createdProfile,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ Error creating user ${email}:`, error.message);
    return {
      email: email,
      error: error.message,
      success: false
    };
  }
}

// Process users in batches
async function createUsersInBatches() {
  console.log(`🎯 Starting bulk user creation for ${TEST_USERS.length} users`);
  console.log(`📦 Processing in batches of ${BATCH_SIZE} users`);
  console.log(`🔒 Using bcrypt with ${SALT_ROUNDS} salt rounds for security`);
  console.log('═'.repeat(60));
  
  const results = {
    created: [],
    skipped: [],
    errors: []
  };
  
  // Process users in batches
  for (let i = 0; i < TEST_USERS.length; i += BATCH_SIZE) {
    const batch = TEST_USERS.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(TEST_USERS.length / BATCH_SIZE);
    
    console.log(`\n📦 Processing Batch ${batchNumber}/${totalBatches} (${batch.length} users)`);
    console.log('─'.repeat(40));
    
    // Check existing users in parallel
    const existenceChecks = await Promise.all(
      batch.map(async (userData) => ({
        ...userData,
        exists: await userExists(userData.email)
      }))
    );
    
    // Filter out existing users
    const usersToCreate = existenceChecks.filter(user => {
      if (user.exists) {
        console.log(`⏭️  User already exists, skipping: ${user.email}`);
        results.skipped.push(user.email);
        return false;
      }
      return true;
    });
    
    if (usersToCreate.length === 0) {
      console.log(`ℹ️  No new users to create in this batch`);
      continue;
    }
    
    // Create users sequentially within batch to avoid overwhelming the database
    for (const userData of usersToCreate) {
      const result = await createUserWithProfile(userData);
      
      if (result.success) {
        results.created.push({
          email: userData.email,
          userId: result.user.id,
          profileId: result.profile.id
        });
      } else {
        results.errors.push({
          email: result.email,
          error: result.error
        });
      }
      
      // Small delay between users to avoid overwhelming the database
      if (usersToCreate.indexOf(userData) < usersToCreate.length - 1) {
        await delay(100);
      }
    }
    
    // Delay between batches to avoid timeouts
    if (i + BATCH_SIZE < TEST_USERS.length) {
      console.log(`⏳ Waiting 2 seconds before next batch...`);
      await delay(2000);
    }
  }
  
  return results;
}

// Main execution function
async function main() {
  console.log('🚀 AutoJobr Test Users Creation Script');
  console.log('═'.repeat(60));
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🔢 Total users to process: ${TEST_USERS.length}`);
  
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await db.select().from(users).limit(1);
    console.log('✅ Database connection successful');
    
    // Create users
    const results = await createUsersInBatches();
    
    // Print results summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL RESULTS SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully created: ${results.created.length} users`);
    console.log(`⏭️  Skipped (already exist): ${results.skipped.length} users`);
    console.log(`❌ Errors: ${results.errors.length} users`);
    
    if (results.created.length > 0) {
      console.log('\n📝 Created Users:');
      results.created.forEach(user => {
        console.log(`   ✅ ${user.email} (ID: ${user.userId})`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log('\n📝 Skipped Users:');
      results.skipped.forEach(email => {
        console.log(`   ⏭️  ${email}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n📝 Failed Users:');
      results.errors.forEach(error => {
        console.log(`   ❌ ${error.email}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Script completed successfully!');
    console.log(`📅 Finished at: ${new Date().toISOString()}`);
    
    // Exit with appropriate code
    process.exit(results.errors.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n💥 Script failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the script
main();