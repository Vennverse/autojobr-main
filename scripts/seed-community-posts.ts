import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

const users = [
  { email: 'emma.google@autojobr.com', company: 'Google' },
  { email: 'liam.meta@autojobr.com', company: 'Meta' },
  { email: 'olivia.apple@autojobr.com', company: 'Apple' },
  { email: 'noah.amazon@autojobr.com', company: 'Amazon' },
  { email: 'ava.microsoft@autojobr.com', company: 'Microsoft' },
  { email: 'ethan.netflix@autojobr.com', company: 'Netflix' },
  { email: 'mia.uber@autojobr.com', company: 'Uber' },
  { email: 'lucas.x(twitter)@autojobr.com', company: 'X (Twitter)' },
  { email: 'sophia.linkedin@autojobr.com', company: 'LinkedIn' },
  { email: 'jack.tesla@autojobr.com', company: 'Tesla' },
];

const posts = [
  { content: "🎉 Just got my offer letter from Google! After 6 months of preparation and 4 interview rounds, I'm officially joining the Search team! Dreams do come true! 💙", type: "job_offer", image: "happy_professional_c_904f342b.jpg" },
  { content: "Celebrating 1 year at Meta today! What an incredible journey it's been. From joining as a junior developer to now leading a small team. Grateful for every challenge! 🚀", type: "achievement", image: "team_collaboration_m_e67eb06e.jpg" },
  { content: "Quick tip for job seekers: Always research the company culture before interviews. It helped me land my dream role at Apple! 🍎 Happy to share more tips if anyone's interested.", type: "tip", image: "laptop_workspace_cof_8caf8ea2.jpg" },
  { content: "After 50+ applications and 10 interviews, I finally got my YES from Amazon! Never give up on your dreams. The right opportunity will come at the right time! 📦✨", type: "success", image: "graduation_celebrati_eb7a5f29.jpg" },
  { content: "Just wrapped up an amazing project at Microsoft! Our team shipped a feature that will impact millions of users. So proud of what we accomplished together! 💪", type: "achievement", image: "career_growth_profes_dec6714e.jpg" },
  { content: "Starting my new position at Netflix next week! Can't wait to work on products that bring joy to millions of people worldwide. Let's go! 🎬", type: "job_offer", image: "motivational_quote_t_a73e881f.jpg" },
  { content: "Pro tip: Take time to build side projects. They were the key differentiator in my Uber interview! Showcasing real work beats talking theory every time. 🚗", type: "tip", image: "laptop_workspace_cof_2279f467.jpg" },
  { content: "Completed my first week at X! The pace is intense but incredibly exciting. Working on features that will shape the future of social media. 🐦", type: "general", image: "happy_professional_c_4041245f.jpg" },
  { content: "Just got promoted to Senior Engineer at LinkedIn! Hard work, consistency, and great mentors made this possible. Thank you to everyone who supported me! 🏆", type: "achievement", image: "graduation_celebrati_1b44c9ee.jpg" },
  { content: "Tesla welcomed me today! First day and I'm already impressed by the innovation culture here. Excited to contribute to sustainable energy! ⚡", type: "job_offer", image: "team_collaboration_m_a7e49d05.jpg" },
  { content: "Remember: Every rejection is one step closer to the right YES. Keep applying, keep learning, keep growing! 💪 #JobSearch #Motivation", type: "tip", image: "motivational_quote_t_bbf3b628.jpg" },
  { content: "Learned so much in my first month at Google. The scale of problems we solve here is mind-blowing. Grateful for this opportunity! 🌟", type: "general", image: "career_growth_profes_d3c4a0da.jpg" },
  { content: "Successfully launched my first feature at Meta today! Seeing your code in production hitting millions of users is an incredible feeling! 🎯", type: "success", image: "happy_professional_c_56f7050a.jpg" },
  { content: "Interview tip: Always ask thoughtful questions at the end. It shows genuine interest and helps you evaluate if the company is right for YOU too! 💡", type: "tip", image: "laptop_workspace_cof_1d4161d6.jpg" },
  { content: "6 months into my Apple journey and loving every moment! The attention to detail in everything we build is inspiring. 🍎✨", type: "general", image: "team_collaboration_m_7040f67c.jpg" },
  { content: "Just completed AWS certification! Investing in continuous learning paid off. Amazon values growth mindset and it shows! 📚", type: "achievement", image: "graduation_celebrati_4ff76df7.jpg" },
  { content: "Shipped a major update at Microsoft today! Collaboration across 5 teams made this possible. Teamwork makes the dream work! 🤝", type: "success", image: "team_collaboration_m_02754daf.jpg" },
  { content: "Netflix culture is real! The freedom and responsibility approach truly empowers us to do our best work. Loving it here! 🎥", type: "general", image: "career_growth_profes_a1de1403.jpg" },
  { content: "Hot take: Soft skills matter as much as technical skills. My communication skills helped me stand out in my Uber interview process! 🗣️", type: "tip", image: "motivational_quote_t_c556f768.jpg" },
  { content: "3 months at X and already working on features I use daily! There's something special about building products you're passionate about. 🚀", type: "general", image: "happy_professional_c_24d7418b.jpg" },
];

async function loginUser(email: string) {
  const response = await fetch(`${BASE_URL}/api/auth/email/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });

  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) {
    throw new Error(`Login failed for ${email}`);
  }

  return setCookieHeader;
}

async function createPost(cookie: string, content: string, postType: string, imagePath: string | null) {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('postType', postType);
  formData.append('visibility', 'public');

  if (imagePath && fs.existsSync(imagePath)) {
    formData.append('media', fs.createReadStream(imagePath));
  }

  const response = await fetch(`${BASE_URL}/api/community/posts`, {
    method: 'POST',
    headers: {
      'Cookie': cookie,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create post: ${error}`);
  }

  return await response.json();
}

async function seedPosts() {
  console.log('🌱 Starting community posts seeding...\n');

  for (let i = 0; i < posts.length; i++) {
    const user = users[i % users.length];
    const post = posts[i];

    try {
      console.log(`📝 Creating post ${i + 1}/${posts.length} by ${user.email.split('@')[0]}...`);
      
      const cookie = await loginUser(user.email);
      
      const imagePath = post.image 
        ? path.join(process.cwd(), 'attached_assets', 'stock_images', post.image)
        : null;

      await createPost(cookie, post.content, post.type, imagePath);
      
      console.log(`✅ Post created successfully!\n`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to create post: ${error}\n`);
    }
  }

  console.log('🎉 Seeding complete!');
}

seedPosts().catch(console.error);
