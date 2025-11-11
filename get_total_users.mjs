
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { count } from 'drizzle-orm';

async function getTotalUsers() {
  try {
    console.log('📊 Fetching total users from database...\n');
    
    // Get total count
    const totalResult = await db.select({ count: count() }).from(users);
    const total = totalResult[0]?.count || 0;
    
    console.log(`✅ Total Users: ${total}\n`);
    
    // Get breakdown by user type
    const usersByType = await db
      .select()
      .from(users);
    
    const jobSeekers = usersByType.filter(u => u.userType === 'job_seeker').length;
    const recruiters = usersByType.filter(u => u.userType === 'recruiter').length;
    const admins = usersByType.filter(u => u.userType === 'admin').length;
    
    console.log('📈 Breakdown by User Type:');
    console.log(`   👥 Job Seekers: ${jobSeekers}`);
    console.log(`   💼 Recruiters: ${recruiters}`);
    console.log(`   🔑 Admins: ${admins}\n`);
    
    // Get breakdown by plan type
    const freePlan = usersByType.filter(u => !u.planType || u.planType === 'free').length;
    const premiumPlan = usersByType.filter(u => u.planType === 'premium').length;
    const ultraPremium = usersByType.filter(u => u.planType === 'ultra_premium').length;
    
    console.log('💰 Breakdown by Plan Type:');
    console.log(`   🆓 Free: ${freePlan}`);
    console.log(`   ⭐ Premium: ${premiumPlan}`);
    console.log(`   💎 Ultra Premium: ${ultraPremium}\n`);
    
    // Get recent signups
    const recentUsers = usersByType
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    console.log('📅 Recent 5 Signups:');
    recentUsers.forEach((user, i) => {
      const date = new Date(user.createdAt).toLocaleDateString();
      console.log(`   ${i + 1}. ${user.email} (${user.userType}) - ${date}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    process.exit(1);
  }
}

getTotalUsers();
