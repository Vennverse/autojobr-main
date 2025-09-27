import {
  users,
  userProfiles,
  userSkills,
  workExperience,
  education,
  jobApplications,
  jobRecommendations,
  aiJobAnalyses,
  resumes,
  jobPostings,
  jobPostingApplications,
  conversations,
  messages,
  emailVerificationTokens,
  passwordResetTokens,
  testTemplates,
  testAssignments,
  testRetakePayments,
  testGenerationLogs,
  mockInterviews,
  mockInterviewQuestions,
  interviewPayments,
  userInterviewStats,
  bidderRegistrations,
  projects,
  bids,
  projectPayments,
  projectMilestones,
  // Career AI Enhancement Tables
  skillProgressLogs,
  achievementsCatalog,
  userAchievements,
  learningResources,
  userLearningPlan,
  interviewPreps,
  notifications,
  mentorProfiles,
  mentorshipRequests,
  sharedJourneys,
  challenges,
  challengeParticipants,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type UserSkill,
  type InsertUserSkill,
  type WorkExperience,
  type InsertWorkExperience,
  type Education,
  type InsertEducation,
  type JobApplication,
  type InsertJobApplication,
  type JobRecommendation,
  type InsertJobRecommendation,
  type AiJobAnalysis,
  type InsertAiJobAnalysis,
  type Resume,
  type InsertResume,
  type JobPosting,
  type InsertJobPosting,
  type JobPostingApplication,
  type InsertJobPostingApplication,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type TestTemplate,
  type InsertTestTemplate,
  type TestAssignment,
  type InsertTestAssignment,
  type TestRetakePayment,
  type InsertTestRetakePayment,
  type MockInterview,
  type InsertMockInterview,
  type MockInterviewQuestion,
  type InsertMockInterviewQuestion,
  type InterviewPayment,
  type InsertInterviewPayment,
  type UserInterviewStats,
  type InsertUserInterviewStats,
  type SelectBidderRegistration,
  type InsertBidderRegistration,
  type SelectProject,
  type InsertProject,
  type SelectBid,
  type InsertBid,
  type SelectProjectPayment,
  type InsertProjectPayment,
  type SelectProjectMilestone,
  type InsertProjectMilestone,
  // Career AI Enhancement Types
  type SkillProgressLog,
  type InsertSkillProgressLog,
  type AchievementsCatalog,
  type InsertAchievementsCatalog,
  type UserAchievement,
  type InsertUserAchievement,
  type LearningResource,
  type InsertLearningResource,
  type UserLearningPlan,
  type InsertUserLearningPlan,
  type InterviewPrep,
  type InsertInterviewPrep,
  type Notification,
  type InsertNotification,
  type MentorProfile,
  type InsertMentorProfile,
  type MentorshipRequest,
  type InsertMentorshipRequest,
  type SharedJourney,
  type InsertSharedJourney,
  type Challenge,
  type InsertChallenge,
  type ChallengeParticipant,
  type InsertChallengeParticipant,
  questionBank,
  userResumes,
  type UserResume,
  type InsertUserResume,
  subscriptions,
  // Advanced Assessment Tables (Imported schema for new tables)
  videoInterviews,
  videoResponses,
  simulationAssessments,
  personalityAssessments,
  skillsVerifications,
  type VideoInterview,
  type InsertVideoInterview,
  type VideoResponse,
  type InsertVideoResponse,
  type SimulationAssessment,
  type InsertSimulationAssessment,
  type PersonalityAssessment,
  type InsertPersonalityAssessment,
  type SkillsVerification,
  type InsertSkillsVerification,
} from "@shared/schema";
import { db } from "./db";

// Helper function to handle database errors gracefully
async function handleDbOperation<T>(operation: () => Promise<T>, fallback?: T): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error.message?.includes('endpoint is disabled') || error.message?.includes('Control plane request failed')) {
      console.warn('Database operation failed due to Replit DB issues, using fallback');
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error('Database temporarily unavailable');
    }
    throw error;
  }
}
import { eq, desc, and, or, ne, sql, lt, isNotNull, count, isNull, asc, like } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;

  // Resume operations
  getUserResumes(userId: string): Promise<any[]>;
  storeResume(userId: string, resumeData: any): Promise<any>;

  // Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;

  // Skills operations
  getUserSkills(userId: string): Promise<UserSkill[]>;
  addUserSkill(skill: InsertUserSkill): Promise<UserSkill>;
  deleteUserSkill(id: number): Promise<void>;

  // Work experience operations
  getUserWorkExperience(userId: string): Promise<WorkExperience[]>;
  addWorkExperience(experience: InsertWorkExperience): Promise<WorkExperience>;
  updateWorkExperience(id: number, experience: Partial<InsertWorkExperience>): Promise<WorkExperience>;
  deleteWorkExperience(id: number): Promise<void>;

  // Education operations
  getUserEducation(userId: string): Promise<Education[]>;
  addEducation(education: InsertEducation): Promise<Education>;
  updateEducation(id: number, education: Partial<InsertEducation>): Promise<Education>;
  deleteEducation(id: number): Promise<void>;

  // Job applications operations
  getUserApplications(userId: string): Promise<JobApplication[]>;
  addJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, application: Partial<InsertJobApplication>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<void>;
  getApplicationStats(userId: string): Promise<{
    totalApplications: number;
    interviews: number;
    responseRate: number;
    avgMatchScore: number;
  }>;

  // Job recommendations operations
  getUserRecommendations(userId: string): Promise<JobRecommendation[]>;
  addJobRecommendation(recommendation: InsertJobRecommendation): Promise<JobRecommendation>;
  updateJobRecommendation(id: number, recommendation: Partial<InsertJobRecommendation>): Promise<JobRecommendation>;
  toggleBookmark(id: number): Promise<JobRecommendation>;

  // AI Job Analysis operations
  getUserJobAnalyses(userId: string): Promise<AiJobAnalysis[]>;
  addJobAnalysis(analysis: InsertAiJobAnalysis): Promise<AiJobAnalysis>;
  getJobAnalysisByUrl(userId: string, jobUrl: string): Promise<AiJobAnalysis | undefined>;
  updateJobAnalysis(id: number, analysis: Partial<InsertAiJobAnalysis>): Promise<AiJobAnalysis>;

  // Subscription operations
  updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    paypalOrderId?: string;
    subscriptionStatus?: string;
    planType?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }): Promise<User>;
  getUserByPaypalSubscription(paypalSubscriptionId: string): Promise<User | undefined>;

  // Subscription tiers and features
  getSubscriptionTiers(): Promise<any[]>;
  canUseFeature(userId: string, feature: string): Promise<boolean>;
  incrementUsage(userId: string, feature: string): Promise<void>;

  // Recruiter operations
  // Job postings
  getJobPostings(recruiterId?: string): Promise<JobPosting[]>;
  getAllJobs(): Promise<JobPosting[]>;
  getAllJobPostings(): Promise<JobPosting[]>;
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, jobPosting: Partial<InsertJobPosting>): Promise<JobPosting>;
  deleteJobPosting(id: number): Promise<void>;
  incrementJobPostingViews(id: number): Promise<void>;

  // Job posting applications
  getJobPostingApplications(jobPostingId: number): Promise<JobPostingApplication[]>;
  getJobPostingApplication(id: number): Promise<JobPostingApplication | undefined>;
  getApplicationsForRecruiter(recruiterId: string): Promise<JobPostingApplication[]>;
  getApplicationsForJobSeeker(jobSeekerId: string): Promise<JobPostingApplication[]>;
  getApplicationsForJob(jobId: number): Promise<JobPostingApplication[]>;
  createJobPostingApplication(application: InsertJobPostingApplication): Promise<JobPostingApplication>;
  updateJobPostingApplication(id: number, application: Partial<InsertJobPostingApplication>): Promise<JobPostingApplication>;
  deleteJobPostingApplication(id: number): Promise<void>;

  // Chat system
  getChatConversations(userId: string): Promise<Conversation[]>;
  getChatConversation(id: number): Promise<Conversation | undefined>;
  createChatConversation(conversation: InsertConversation): Promise<Conversation>;
  getChatMessages(conversationId: number): Promise<Message[]>;
  createChatMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;
  updateConversationLastMessage(conversationId: number): Promise<void>;

  // Email verification
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(token: string): Promise<void>;
  deleteEmailVerificationTokensByUserId(userId: string): Promise<void>;
  updateUserEmailVerification(userId: string, verified: boolean): Promise<User>;

  // Password Reset Token methods
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;

  // Test system operations
  getTestTemplates(jobProfile?: string, isGlobal?: boolean): Promise<TestTemplate[]>;
  getTestTemplate(id: number): Promise<TestTemplate | undefined>;
  createTestTemplate(template: InsertTestTemplate): Promise<TestTemplate>;
  updateTestTemplate(id: number, template: Partial<InsertTestTemplate>): Promise<TestTemplate>;
  deleteTestTemplate(id: number): Promise<void>;
  getTestTemplateQuestions(templateId: number): Promise<any[]>;
  createTestQuestion(question: any): Promise<any>;
  updateTestQuestion(questionId: string, updatedQuestion: any): Promise<any>;
  deleteTestQuestion(questionId: string): Promise<void>;

  // Test assignments
  getTestAssignments(recruiterId?: string, jobSeekerId?: string): Promise<TestAssignment[]>;
  getTestAssignment(id: number): Promise<TestAssignment | undefined>;
  createTestAssignment(assignment: InsertTestAssignment): Promise<TestAssignment>;
  updateTestAssignment(id: number, assignment: Partial<InsertTestAssignment>): Promise<TestAssignment>;
  deleteTestAssignment(id: number): Promise<void>;

  // Test retake payments
  getTestRetakePayments(userId: string): Promise<TestRetakePayment[]>;
  getTestRetakePayment(id: number): Promise<TestRetakePayment | undefined>;
  createTestRetakePayment(payment: InsertTestRetakePayment): Promise<TestRetakePayment>;
  updateTestRetakePayment(id: number, payment: Partial<InsertTestRetakePayment>): Promise<TestRetakePayment>;

  // Test generation logs
  createTestGenerationLog(log: any): Promise<any>;
  getTestGenerationLogs(testTemplateId?: number, assignmentId?: number): Promise<any[]>;

  // Mock interview operations
  getMockInterviews(userId: string): Promise<MockInterview[]>;
  getMockInterview(id: number): Promise<MockInterview | undefined>;
  getMockInterviewBySessionId(sessionId: string, userId?: string): Promise<MockInterview | undefined>;
  createMockInterview(interview: InsertMockInterview): Promise<MockInterview>;
  updateMockInterview(id: number, interview: Partial<InsertMockInterview>): Promise<MockInterview>;
  deleteMockInterview(id: number): Promise<void>;

  // Mock interview questions
  getMockInterviewQuestions(interviewId: number): Promise<MockInterviewQuestion[]>;
  getMockInterviewQuestion(id: number): Promise<MockInterviewQuestion | undefined>;
  createMockInterviewQuestion(question: InsertMockInterviewQuestion): Promise<MockInterviewQuestion>;
  updateMockInterviewQuestion(id: number, question: Partial<InsertMockInterviewQuestion>): Promise<MockInterviewQuestion>;
  deleteMockInterviewQuestion(id: number): Promise<void>;

  // Interview payments
  getInterviewPayments(userId: string): Promise<InterviewPayment[]>;
  getInterviewPayment(id: number): Promise<InterviewPayment | undefined>;
  createInterviewPayment(payment: InsertInterviewPayment): Promise<InterviewPayment>;
  updateInterviewPayment(id: number, payment: Partial<InsertInterviewPayment>): Promise<InterviewPayment>;

  // Question bank operations
  getQuestionBankQuestions(filters?: { type?: string; difficulty?: string; limit?: number }): Promise<any[]>;

  // User interview stats
  getUserInterviewStats(userId: string): Promise<UserInterviewStats | undefined>;
  upsertUserInterviewStats(stats: InsertUserInterviewStats): Promise<UserInterviewStats>;

  // ===== CAREER AI ENHANCEMENT OPERATIONS =====

  // Skill Progress Logs
  getUserSkillProgressLogs(userId: string): Promise<SkillProgressLog[]>;
  addSkillProgressLog(log: InsertSkillProgressLog): Promise<SkillProgressLog>;
  getSkillProgressBySkill(userId: string, skill: string): Promise<SkillProgressLog[]>;

  // Achievements System
  getAchievementsCatalog(category?: string): Promise<AchievementsCatalog[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  addUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  getUserAchievementPoints(userId: string): Promise<number>;

  // Learning Resources & Plan
  getLearningResources(skill?: string, difficulty?: string): Promise<LearningResource[]>;
  addLearningResource(resource: InsertLearningResource): Promise<LearningResource>;
  getUserLearningPlan(userId: string): Promise<UserLearningPlan[]>;
  addToLearningPlan(plan: InsertUserLearningPlan): Promise<UserLearningPlan>;
  updateLearningPlanProgress(id: number, progress: number, status?: string): Promise<UserLearningPlan>;

  // Interview Preparation
  getUserInterviewPreps(userId: string): Promise<InterviewPrep[]>;
  createInterviewPrep(prep: InsertInterviewPrep): Promise<InterviewPrep>;
  updateInterviewPrepUsage(id: number): Promise<InterviewPrep>;

  // Smart Notifications
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Mentorship System
  getMentorProfiles(skills?: string[], verified?: boolean): Promise<MentorProfile[]>;
  getUserMentorProfile(userId: string): Promise<MentorProfile | undefined>;
  createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile>;
  updateMentorProfile(userId: string, updates: Partial<InsertMentorProfile>): Promise<MentorProfile>;

  getMentorshipRequests(mentorId?: string, menteeId?: string): Promise<MentorshipRequest[]>;
  createMentorshipRequest(request: InsertMentorshipRequest): Promise<MentorshipRequest>;
  updateMentorshipRequest(id: number, updates: Partial<InsertMentorshipRequest>): Promise<MentorshipRequest>;

  // Career Journey Sharing
  getSharedJourneys(filters?: { visibility?: string; careerPath?: string; featured?: boolean }): Promise<SharedJourney[]>;
  getUserSharedJourneys(userId: string): Promise<SharedJourney[]>;
  createSharedJourney(journey: InsertSharedJourney): Promise<SharedJourney>;
  updateSharedJourney(id: number, updates: Partial<InsertSharedJourney>): Promise<SharedJourney>;
  incrementJourneyViews(id: number): Promise<void>;
  toggleJourneyLike(id: number): Promise<SharedJourney>;

  // Community Challenges
  getActiveChallenges(): Promise<Challenge[]>;
  getUserChallenges(userId: string): Promise<ChallengeParticipant[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  joinChallenge(participation: InsertChallengeParticipant): Promise<ChallengeParticipant>;
  updateChallengeProgress(id: number, progress: object, currentCount: number): Promise<ChallengeParticipant>;
  getChallengeLeaderboard(challengeId: number): Promise<ChallengeParticipant[]>;

  // ===== BIDDER SYSTEM OPERATIONS =====

  // Bidder registration operations
  getBidderRegistration(userId: string): Promise<SelectBidderRegistration | undefined>;
  createBidderRegistration(registration: InsertBidderRegistration): Promise<SelectBidderRegistration>;
  updateBidderRegistration(userId: string, updates: Partial<InsertBidderRegistration>): Promise<SelectBidderRegistration>;

  // Project operations
  getProjects(filters?: { status?: string; type?: string; category?: string }): Promise<SelectProject[]>;
  getProject(id: number): Promise<SelectProject | undefined>;
  getUserProjects(userId: string): Promise<SelectProject[]>;
  createProject(project: InsertProject): Promise<SelectProject>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<SelectProject>;
  deleteProject(id: number): Promise<void>;

  // Bid operations
  getProjectBids(projectId: number): Promise<SelectBid[]>;
  getUserBids(userId: string): Promise<SelectBid[]>;
  getBid(id: number): Promise<SelectBid | undefined>;
  createBid(bid: InsertBid): Promise<SelectBid>;
  updateBid(id: number, updates: Partial<InsertBid>): Promise<SelectBid>;
  deleteBid(id: number): Promise<void>;
  acceptBid(bidId: number): Promise<SelectBid>;

  // Project payment operations
  getProjectPayment(projectId: number): Promise<SelectProjectPayment | undefined>;
  createProjectPayment(payment: InsertProjectPayment): Promise<SelectProjectPayment>;
  updateProjectPayment(id: number, updates: Partial<InsertProjectPayment>): Promise<SelectProjectPayment>;

  // Project milestone operations
  getProjectMilestones(projectId: number): Promise<SelectProjectMilestone[]>;
  createProjectMilestone(milestone: InsertProjectMilestone): Promise<SelectProjectMilestone>;
  updateProjectMilestone(id: number, updates: Partial<InsertProjectMilestone>): Promise<SelectProjectMilestone>;

  // ===== ADVANCED ASSESSMENT OPERATIONS =====
  createVideoInterview(data: InsertVideoInterview): Promise<VideoInterview>;
  createVideoResponse(data: InsertVideoResponse): Promise<VideoResponse>;
  getVideoInterview(id: number): Promise<VideoInterview | undefined>;
  getVideoResponse(id: number): Promise<VideoResponse | undefined>;
  getVideoResponses(interviewId: number): Promise<VideoResponse[]>;
  updateVideoResponse(id: number, data: Partial<InsertVideoResponse>): Promise<VideoResponse>;
  updateVideoInterview(id: number, data: Partial<InsertVideoInterview>): Promise<VideoInterview>;

  createSimulationAssessment(data: InsertSimulationAssessment): Promise<SimulationAssessment>;
  getSimulationAssessment(id: number): Promise<SimulationAssessment | undefined>;
  updateSimulationAssessment(id: number, data: Partial<InsertSimulationAssessment>): Promise<SimulationAssessment>;

  createPersonalityAssessment(data: InsertPersonalityAssessment): Promise<PersonalityAssessment>;
  getPersonalityAssessment(id: number): Promise<PersonalityAssessment | undefined>;
  updatePersonalityAssessment(id: number, data: Partial<InsertPersonalityAssessment>): Promise<PersonalityAssessment>;

  createSkillsVerification(data: InsertSkillsVerification): Promise<SkillsVerification>;
  getSkillsVerification(id: number): Promise<SkillsVerification | undefined>;
  updateSkillsVerification(id: number, data: Partial<InsertSkillsVerification>): Promise<SkillsVerification>;

  // Skills verification deliverable submissions
  createDeliverableSubmission(submission: {
    skillsVerificationId: number;
    deliverableId: string;
    filePath: string;
    fileName: string;
    fileType: string;
    metadata: any;
  }): Promise<any>;
  getDeliverableSubmissions(skillsVerificationId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Use db directly from the imported module
  private db = db;

  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    return await handleDbOperation(async () => {
      const [user] = await this.db.select().from(users).where(eq(users.id, id));
      return user;
    }, undefined);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await handleDbOperation(async () => {
      const [user] = await this.db.select().from(users).where(eq(users.email, email));
      return user;
    }, undefined);
  }

  async getAllUsers(): Promise<User[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(users);
    }, []);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return await handleDbOperation(async () => {
      // COMPREHENSIVE ROLE SYNCHRONIZATION FIX
      // Always ensure currentRole matches userType to prevent future role consistency issues
      const normalizedUserData = {
        ...userData,
        // Force currentRole to match userType whenever userType is provided
        currentRole: userData.userType || userData.currentRole || 'job_seeker',
        // Update availableRoles if userType changes
        availableRoles: userData.userType === 'recruiter' ? 'job_seeker,recruiter' : (userData.availableRoles || 'job_seeker'),
        updatedAt: new Date(),
      };

      // Log role synchronization for debugging
      if (userData.userType && userData.currentRole && userData.userType !== userData.currentRole) {
        console.log(`🔄 Auto-fixing role mismatch for user: ${userData.id || userData.email} - ${userData.currentRole} -> ${userData.userType}`);
      }

      const [user] = await this.db
        .insert(users)
        .values(normalizedUserData)
        .onConflictDoUpdate({
          target: users.id,
          set: normalizedUserData,
        })
        .returning();
      return user;
    }, userData as User);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    return await handleDbOperation(async () => {
      // COMPREHENSIVE ROLE UPDATE - Always sync both fields
      const [user] = await this.db
        .update(users)
        .set({
          currentRole: role,
          userType: role, // Keep both in sync
          availableRoles: role === 'recruiter' ? 'job_seeker,recruiter' : 'job_seeker',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      console.log(`✅ Role updated for user ${userId}: Both userType and currentRole set to ${role}`);
      return user;
    });
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(profileData: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(profileData.userId);

    if (existing) {
      const [profile] = await this.db
        .update(userProfiles)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(userProfiles.userId, profileData.userId))
        .returning();
      return profile;
    } else {
      const [profile] = await this.db
        .insert(userProfiles)
        .values(profileData)
        .returning();
      return profile;
    }
  }

  // Skills operations
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    return await this.db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, userId));
  }

  async addUserSkill(skill: InsertUserSkill): Promise<UserSkill> {
    const [newSkill] = await this.db
      .insert(userSkills)
      .values(skill)
      .returning();
    return newSkill;
  }

  async deleteUserSkill(id: number): Promise<void> {
    await this.db.delete(userSkills).where(eq(userSkills.id, id));
  }

  // Work experience operations
  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    return await this.db
      .select()
      .from(workExperience)
      .where(eq(workExperience.userId, userId))
      .orderBy(desc(workExperience.startDate));
  }

  async addWorkExperience(experience: InsertWorkExperience): Promise<WorkExperience> {
    const [newExperience] = await this.db
      .insert(workExperience)
      .values(experience)
      .returning();
    return newExperience;
  }

  async updateWorkExperience(id: number, experienceData: Partial<InsertWorkExperience>): Promise<WorkExperience> {
    const [updatedExperience] = await this.db
      .update(workExperience)
      .set(experienceData)
      .where(eq(workExperience.id, id))
      .returning();
    return updatedExperience;
  }

  async deleteWorkExperience(id: number): Promise<void> {
    await this.db.delete(workExperience).where(eq(workExperience.id, id));
  }

  // Education operations
  async getUserEducation(userId: string): Promise<Education[]> {
    return await this.db
      .select()
      .from(education)
      .where(eq(education.userId, userId))
      .orderBy(desc(education.startDate));
  }

  async addEducation(educationData: InsertEducation): Promise<Education> {
    const [newEducation] = await this.db
      .insert(education)
      .values(educationData)
      .returning();
    return newEducation;
  }

  async updateEducation(id: number, educationData: Partial<InsertEducation>): Promise<Education> {
    const [updatedEducation] = await this.db
      .update(education)
      .set(educationData)
      .where(eq(education.id, id))
      .returning();
    return updatedEducation;
  }

  async deleteEducation(id: number): Promise<void> {
    await this.db.delete(education).where(eq(education.id, id));
  }

  // Job applications operations
  async getUserApplications(userId: string): Promise<JobApplication[]> {
    return await this.db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.appliedDate));
  }

  async addJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await this.db
      .insert(jobApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async updateJobApplication(id: number, applicationData: Partial<InsertJobApplication>): Promise<JobApplication> {
    const [updatedApplication] = await this.db
      .update(jobApplications)
      .set({ ...applicationData, lastUpdated: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();

    if (!updatedApplication) {
      throw new Error(`Application with id ${id} not found`);
    }

    return updatedApplication;
  }

  async deleteJobApplication(id: number): Promise<void> {
    await this.db.delete(jobApplications).where(eq(jobApplications.id, id));
  }

  async getApplicationStats(userId: string): Promise<{
    totalApplications: number;
    interviews: number;
    responseRate: number;
    avgMatchScore: number;
  }> {
    const applications = await this.getUserApplications(userId);

    const totalApplications = applications.length;
    const interviews = applications.filter(app => app.status === 'interview' || app.status === 'offer').length;
    const responseRate = totalApplications > 0 ? Math.round((interviews / totalApplications) * 100) : 0;
    const avgMatchScore = applications.length > 0
      ? Math.round(applications.reduce((sum, app) => sum + (app.matchScore || 0), 0) / applications.length)
      : 0;

    return {
      totalApplications,
      interviews,
      responseRate,
      avgMatchScore,
    };
  }

  // Job recommendations operations
  async getUserRecommendations(userId: string): Promise<JobRecommendation[]> {
    return await this.db
      .select()
      .from(jobRecommendations)
      .where(eq(jobRecommendations.userId, userId))
      .orderBy(desc(jobRecommendations.matchScore));
  }

  async addJobRecommendation(recommendation: InsertJobRecommendation): Promise<JobRecommendation> {
    const [newRecommendation] = await this.db
      .insert(jobRecommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }

  async updateJobRecommendation(id: number, recommendationData: Partial<InsertJobRecommendation>): Promise<JobRecommendation> {
    const [updatedRecommendation] = await this.db
      .update(jobRecommendations)
      .set(recommendationData)
      .where(eq(jobRecommendations.id, id))
      .returning();
    return updatedRecommendation;
  }

  async toggleBookmark(id: number): Promise<JobRecommendation> {
    const [recommendation] = await this.db
      .select()
      .from(jobRecommendations)
      .where(eq(jobRecommendations.id, id));

    const [updated] = await this.db
      .update(jobRecommendations)
      .set({ isBookmarked: !recommendation.isBookmarked })
      .where(eq(jobRecommendations.id, id))
      .returning();

    return updated;
  }

  // AI Job Analysis operations
  async getUserJobAnalyses(userId: string): Promise<AiJobAnalysis[]> {
    return await this.db
      .select()
      .from(aiJobAnalyses)
      .where(eq(aiJobAnalyses.userId, userId))
      .orderBy(desc(aiJobAnalyses.createdAt));
  }

  async addJobAnalysis(analysis: InsertAiJobAnalysis): Promise<AiJobAnalysis> {
    const [newAnalysis] = await this.db
      .insert(aiJobAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getJobAnalysisByUrl(userId: string, jobUrl: string): Promise<AiJobAnalysis | undefined> {
    const [analysis] = await this.db
      .select()
      .from(aiJobAnalyses)
      .where(and(eq(aiJobAnalyses.userId, userId), eq(aiJobAnalyses.jobUrl, jobUrl)))
      .orderBy(desc(aiJobAnalyses.createdAt));
    return analysis;
  }

  async updateJobAnalysis(id: number, analysisData: Partial<InsertAiJobAnalysis>): Promise<AiJobAnalysis> {
    const [updatedAnalysis] = await this.db
      .update(aiJobAnalyses)
      .set(analysisData)
      .where(eq(aiJobAnalyses.id, id))
      .returning();
    return updatedAnalysis;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    paypalOrderId?: string;
    subscriptionStatus?: string;
    planType?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }): Promise<User> {
    // Check if user is becoming premium and needs free ranking tests
    const updateData: any = {
      ...subscriptionData,
      updatedAt: new Date(),
    };

    // Grant free ranking tests for premium users
    if (subscriptionData.planType === 'premium' && subscriptionData.subscriptionStatus === 'active') {
      updateData.freeRankingTestsRemaining = 1;
      console.log(`✅ Granted 1 free ranking test to premium user ${userId}`);
    }

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByPaypalSubscription(paypalSubscriptionId: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.paypalSubscriptionId, paypalSubscriptionId));
    return user;
  }

  // Subscription tiers and features
  async getSubscriptionTiers(): Promise<any[]> {
    return await handleDbOperation(async () => {
      // Return hardcoded subscription tiers for now
      return [
        { id: 'free', name: 'Free', price: 0, features: ['basic_features'] },
        { id: 'premium', name: 'Premium', price: 29, features: ['premium_features', 'advanced_analytics'] },
        { id: 'enterprise', name: 'Enterprise', price: 99, features: ['all_features', 'priority_support'] }
      ];
    }, []);
  }

  async canUseFeature(userId: string, feature: string): Promise<boolean> {
    return await handleDbOperation(async () => {
      const [user] = await this.db.select().from(users).where(eq(users.id, userId));
      if (!user) return false;

      // For now, allow premium users to use most features
      if (user.planType === 'premium' || user.planType === 'enterprise') {
        return true;
      }

      // Allow free users to use basic features
      return feature === 'basic_features';
    }, false);
  }

  async incrementUsage(userId: string, feature: string): Promise<void> {
    await handleDbOperation(async () => {
      // For now, this is a no-op. In the future, we could track feature usage
      console.log(`User ${userId} used feature: ${feature}`);
    });
  }

  // Resume operations - FIXED to use correct resumes table
  async getUserResumes(userId: string): Promise<any[]> {
    return await handleDbOperation(async () => {
      // For demo user, manage state in memory
      if (userId === 'demo-user-id') {
        // Initialize with demo resume if no uploads exist
        if (!(global as any).demoUserResumes) {
          (global as any).demoUserResumes = [
            {
              id: 1,
              name: "Demo Resume",
              fileName: "demo_resume.pdf",
              isActive: true,
              atsScore: 85,
              uploadedAt: new Date('2024-01-15'),
              fileSize: 245000,
              fileType: 'application/pdf',
              analysis: {
                atsScore: 85,
                recommendations: ["Add more technical keywords", "Improve formatting"],
                keywordOptimization: {
                  missingKeywords: ["React", "TypeScript"],
                  overusedKeywords: [],
                  suggestions: ["Include specific technologies"]
                },
                formatting: {
                  score: 80,
                  issues: ["Inconsistent spacing"],
                  improvements: ["Use consistent bullet points"]
                },
                content: {
                  strengthsFound: ["Strong technical background"],
                  weaknesses: ["Could add more quantified achievements"],
                  suggestions: ["Include metrics and numbers"]
                }
              }
            }
          ];
        }

        return (global as any).demoUserResumes;
      }

      // For real users, query the database
      console.log(`[DEBUG] Fetching resumes for user: ${userId}`);
      const userResumes = await this.db.select().from(resumes).where(eq(resumes.userId, userId));
      console.log(`[DEBUG] Found ${userResumes.length} resumes for user ${userId}`);
      const formattedResumes = userResumes.map(resume => ({
        id: resume.id,
        name: resume.name,
        fileName: resume.fileName,
        filename: resume.fileName, // Keep both for compatibility
        text: resume.resumeText,
        atsScore: resume.atsScore,
        uploadedAt: resume.createdAt,
        userId: resume.userId,
        fileSize: resume.fileSize,
        fileType: resume.mimeType,
        mimeType: resume.mimeType,
        isActive: resume.isActive,
        analysis: resume.analysisData || null,
        recommendations: resume.recommendations || [],
        filePath: resume.filePath // Add file path for new storage system
      }));
      console.log(`[DEBUG] Returning ${formattedResumes.length} formatted resumes for user ${userId}`);
      return formattedResumes;
    }, []);
  }

  async storeResume(userId: string, resumeData: any): Promise<any> {
    return await handleDbOperation(async () => {
      console.log(`[DEBUG] Storing resume for user: ${userId}, file: ${resumeData.fileName}`);
      console.log(`[DEBUG] Resume data fields:`, {
        userId: userId,
        name: resumeData.name,
        fileName: resumeData.fileName,
        hasFilePath: !!resumeData.filePath,
        hasFileData: !!resumeData.fileData,
        fileDataLength: resumeData.fileData ? resumeData.fileData.length : 0,
        atsScore: resumeData.atsScore,
        fileSize: resumeData.fileSize,
        mimeType: resumeData.mimeType,
        isActive: resumeData.isActive
      });

      try {
        const insertData = {
          userId,
          name: resumeData.name,
          fileName: resumeData.fileName,
          filePath: resumeData.filePath || null, // Store only file path, not the actual file data
          fileData: null, // Never store file data in database - use file system instead
          resumeText: resumeData.resumeText || null,
          atsScore: resumeData.atsScore || null,
          analysisData: resumeData.analysis || null,
          recommendations: resumeData.recommendations || null,
          fileSize: resumeData.fileSize || null,
          mimeType: resumeData.mimeType || null,
          isActive: resumeData.isActive || false,
          lastAnalyzed: new Date(),
        };

        console.log(`[DEBUG] Inserting data:`, insertData);

        const [newResume] = await this.db.insert(resumes).values(insertData).returning();

        console.log(`[DEBUG] Resume stored successfully - ID: ${newResume.id}`);
        return newResume;
      } catch (dbError: any) {
        console.error(`[ERROR] Database insert failed:`, dbError);
        console.error(`[ERROR] Error code:`, dbError?.code);
        console.error(`[ERROR] Error detail:`, dbError?.detail);
        console.error(`[ERROR] Error constraint:`, dbError?.constraint);
        throw dbError;
      }
    });
  }

  private async compressData(buffer: Buffer): Promise<Buffer> {
    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);
    return await gzipAsync(buffer);
  }

  private async decompressData(buffer: Buffer): Promise<Buffer> {
    const { gunzip } = await import('zlib');
    const { promisify } = await import('util');
    const gunzipAsync = promisify(gunzip);
    return await gunzipAsync(buffer);
  }

  // Recruiter operations - Job postings
  async getJobPostings(recruiterId?: string): Promise<JobPosting[]> {
    return await handleDbOperation(async () => {
      if (recruiterId) {
        return await this.db.select().from(jobPostings).where(eq(jobPostings.recruiterId, recruiterId)).orderBy(desc(jobPostings.createdAt));
      }
      return await this.db.select().from(jobPostings).where(eq(jobPostings.isActive, true)).orderBy(desc(jobPostings.createdAt));
    }, []);
  }

  async getAllJobs(): Promise<JobPosting[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt));
    }, []);
  }

  async getAllJobPostings(): Promise<JobPosting[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(jobPostings).where(eq(jobPostings.isActive, true)).orderBy(desc(jobPostings.createdAt));
    }, []);
  }

  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    return await handleDbOperation(async () => {
      const [jobPosting] = await this.db.select().from(jobPostings).where(eq(jobPostings.id, id));
      return jobPosting;
    });
  }

  async createJobPosting(jobPostingData: InsertJobPosting): Promise<JobPosting> {
    return await handleDbOperation(async () => {
      const [jobPosting] = await this.db.insert(jobPostings).values(jobPostingData).returning();
      return jobPosting;
    });
  }

  async updateJobPosting(id: number, jobPostingData: Partial<InsertJobPosting>): Promise<JobPosting> {
    return await handleDbOperation(async () => {
      const [jobPosting] = await this.db
        .update(jobPostings)
        .set({ ...jobPostingData, updatedAt: new Date() })
        .where(eq(jobPostings.id, id))
        .returning();
      return jobPosting;
    });
  }

  async deleteJobPosting(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db.delete(jobPostings).where(eq(jobPostings.id, id));
    });
  }

  async incrementJobPostingViews(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db
        .update(jobPostings)
        .set({ viewsCount: sql`${jobPostings.viewsCount} + 1` })
        .where(eq(jobPostings.id, id));
    });
  }

  // Job posting applications
  async getJobPostingApplications(jobPostingId: number): Promise<JobPostingApplication[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(jobPostingApplications).where(eq(jobPostingApplications.jobPostingId, jobPostingId)).orderBy(desc(jobPostingApplications.appliedAt));
    }, []);
  }

  async getJobPostingApplication(id: number): Promise<JobPostingApplication | undefined> {
    return await handleDbOperation(async () => {
      const [application] = await this.db.select().from(jobPostingApplications).where(eq(jobPostingApplications.id, id));
      return application;
    });
  }

  async getApplicationsForRecruiter(recruiterId: string): Promise<JobPostingApplication[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select({
          id: jobPostingApplications.id,
          jobPostingId: jobPostingApplications.jobPostingId,
          applicantId: jobPostingApplications.applicantId,
          resumeId: jobPostingApplications.resumeId,
          coverLetter: jobPostingApplications.coverLetter,
          status: jobPostingApplications.status,
          matchScore: jobPostingApplications.matchScore,
          recruiterNotes: jobPostingApplications.recruiterNotes,
          appliedAt: jobPostingApplications.appliedAt,
          reviewedAt: jobPostingApplications.reviewedAt,
          updatedAt: jobPostingApplications.updatedAt,
          resumeData: sql`NULL`.as('resumeData'),
          // Include job posting information directly as separate fields
          jobPostingTitle: jobPostings.title,
          jobPostingCompany: jobPostings.companyName,
          jobPostingLocation: jobPostings.location,
          jobPostingType: jobPostings.jobType,
          jobPostingWorkMode: jobPostings.workMode,
          // Include applicant information
          applicantName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('applicantName'),
          applicantEmail: users.email,
          applicantFirstName: users.firstName,
          applicantLastName: users.lastName,
        })
        .from(jobPostingApplications)
        .innerJoin(jobPostings, eq(jobPostingApplications.jobPostingId, jobPostings.id))
        .leftJoin(users, eq(jobPostingApplications.applicantId, users.id))
        .where(eq(jobPostings.recruiterId, recruiterId))
        .orderBy(desc(jobPostingApplications.appliedAt));
    }, []);
  }

  async getApplicationsForJobSeeker(jobSeekerId: string): Promise<JobPostingApplication[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(jobPostingApplications).where(eq(jobPostingApplications.applicantId, jobSeekerId)).orderBy(desc(jobPostingApplications.appliedAt));
    }, []);
  }

  async getApplicationsForJob(jobId: number): Promise<JobPostingApplication[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(jobPostingApplications).where(eq(jobPostingApplications.jobPostingId, jobId)).orderBy(desc(jobPostingApplications.appliedAt));
    }, []);
  }

  async createJobPostingApplication(applicationData: InsertJobPostingApplication): Promise<JobPostingApplication> {
    return await handleDbOperation(async () => {
      const [application] = await this.db.insert(jobPostingApplications).values(applicationData).returning();

      // Increment applications count
      await this.db
        .update(jobPostings)
        .set({ applicationsCount: sql`${jobPostings.applicationsCount} + 1` })
        .where(eq(jobPostings.id, applicationData.jobPostingId));

      return application;
    });
  }

  async updateJobPostingApplication(id: number, applicationData: Partial<InsertJobPostingApplication>): Promise<JobPostingApplication> {
    return await handleDbOperation(async () => {
      const [application] = await this.db
        .update(jobPostingApplications)
        .set({ ...applicationData, updatedAt: new Date() })
        .where(eq(jobPostingApplications.id, id))
        .returning();
      return application;
    });
  }

  async deleteJobPostingApplication(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db.delete(jobPostingApplications).where(eq(jobPostingApplications.id, id));
    });
  }

  // Chat system
  async getChatConversations(userId: string): Promise<Conversation[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));
    }, []);
  }

  async getChatConversation(id: number): Promise<Conversation | undefined> {
    return await handleDbOperation(async () => {
      const [conversation] = await this.db.select().from(conversations).where(eq(conversations.id, id));
      return conversation;
    });
  }

  async createChatConversation(conversationData: InsertConversation): Promise<Conversation> {
    return await handleDbOperation(async () => {
      const [conversation] = await this.db.insert(conversations).values(conversationData).returning();
      return conversation;
    });
  }

  async getChatMessages(conversationId: number): Promise<Message[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
    }, []);
  }

  async createChatMessage(messageData: InsertMessage): Promise<Message> {
    return await handleDbOperation(async () => {
      const [message] = await this.db.insert(messages).values(messageData).returning();

      // Update conversation's last message timestamp
      await this.db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, messageData.conversationId));

      return message;
    });
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    return await handleDbOperation(async () => {
      await this.db
        .update(messages)
        .set({
          isRead: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            ne(messages.senderId, userId)
          )
        );
    });
  }

  async updateConversationLastMessage(conversationId: number): Promise<void> {
    return await handleDbOperation(async () => {
      await this.db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));
    });
  }

  // Email verification
  async createEmailVerificationToken(tokenData: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    return await handleDbOperation(async () => {
      const [token] = await this.db.insert(emailVerificationTokens).values(tokenData).returning();
      return token;
    });
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    return await handleDbOperation(async () => {
      const [tokenRecord] = await this.db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
      return tokenRecord;
    });
  }

  async deleteEmailVerificationToken(token: string): Promise<void> {
    return await handleDbOperation(async () => {
      await this.db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    });
  }

  async deleteEmailVerificationTokensByUserId(userId: string): Promise<void> {
    return await handleDbOperation(async () => {
      await this.db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
    });
  }



  async updateUserEmailVerification(userId: string, verified: boolean): Promise<User> {
    return await handleDbOperation(async () => {
      const [user] = await this.db
        .update(users)
        .set({ emailVerified: verified, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  // Password Reset Token methods
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    return await handleDbOperation(async () => {
      const [token] = await this.db.insert(passwordResetTokens).values(tokenData).returning();
      return token;
    });
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return await handleDbOperation(async () => {
      const [tokenRecord] = await this.db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return tokenRecord;
    });
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await handleDbOperation(async () => {
      await this.db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    });
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await handleDbOperation(async () => {
      await this.db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.token, token));
    });
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await handleDbOperation(async () => {
      await this.db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, new Date()));
    });
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    return await handleDbOperation(async () => {
      const [user] = await this.db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  // Test system operations
  async getTestTemplates(jobProfile?: string, isGlobal?: boolean): Promise<TestTemplate[]> {
    return await handleDbOperation(async () => {
      let conditions: any[] = [eq(testTemplates.isActive, true)];

      if (jobProfile) {
        conditions.push(eq(testTemplates.jobProfile, jobProfile));
      }

      if (isGlobal !== undefined) {
        conditions.push(eq(testTemplates.isGlobal, isGlobal));
      }

      return await this.db.select().from(testTemplates)
        .where(and(...conditions))
        .orderBy(desc(testTemplates.createdAt));
    }, []);
  }

  async getTestTemplate(id: number): Promise<TestTemplate | undefined> {
    return await handleDbOperation(async () => {
      const [template] = await this.db.select().from(testTemplates).where(eq(testTemplates.id, id));
      return template;
    }, undefined);
  }

  async createTestTemplate(template: InsertTestTemplate): Promise<TestTemplate> {
    return await handleDbOperation(async () => {
      const [newTemplate] = await this.db.insert(testTemplates).values(template).returning();
      return newTemplate;
    });
  }

  async updateTestTemplate(id: number, template: Partial<InsertTestTemplate>): Promise<TestTemplate> {
    return await handleDbOperation(async () => {
      const [updatedTemplate] = await this.db
        .update(testTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(testTemplates.id, id))
        .returning();
      return updatedTemplate;
    });
  }

  async deleteTestTemplate(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db.delete(testTemplates).where(eq(testTemplates.id, id));
    });
  }

  // Individual test question operations (these decode JSON from template.questions field)
  async getTestTemplateQuestions(templateId: number): Promise<any[]> {
    return await handleDbOperation(async () => {
      const template = await this.getTestTemplate(templateId);
      if (!template || !template.questions) {
        return [];
      }

      try {
        const questions = JSON.parse(template.questions as string);
        return Array.isArray(questions) ? questions : [];
      } catch (error) {
        console.error('Error parsing questions JSON:', error);
        return [];
      }
    }, []);
  }

  async createTestQuestion(question: any): Promise<any> {
    return await handleDbOperation(async () => {
      const template = await this.getTestTemplate(question.testTemplateId);
      if (!template) {
        throw new Error('Test template not found');
      }

      let questions = [];
      try {
        questions = template.questions ? JSON.parse(template.questions as string) : [];
      } catch (error) {
        questions = [];
      }

      // Add new question with unique ID
      const newQuestion = {
        ...question,
        id: `q${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      questions.push(newQuestion);

      // Update template with new questions array
      await this.updateTestTemplate(question.testTemplateId, {
        questions: JSON.stringify(questions)
      });

      return newQuestion;
    });
  }

  async updateTestQuestion(questionId: string, updatedQuestion: any): Promise<any> {
    return await handleDbOperation(async () => {
      const template = await this.getTestTemplate(updatedQuestion.testTemplateId);
      if (!template) {
        throw new Error('Test template not found');
      }

      let questions = [];
      try {
        questions = template.questions ? JSON.parse(template.questions as string) : [];
      } catch (error) {
        questions = [];
      }

      // Find and update the question
      const questionIndex = questions.findIndex((q: any) => q.id === questionId);
      if (questionIndex === -1) {
        throw new Error('Question not found');
      }

      questions[questionIndex] = {
        ...questions[questionIndex],
        ...updatedQuestion,
        updatedAt: new Date().toISOString()
      };

      // Update template with modified questions array
      await this.updateTestTemplate(updatedQuestion.testTemplateId, {
        questions: JSON.stringify(questions)
      });

      return questions[questionIndex];
    });
  }

  async deleteTestQuestion(questionId: string): Promise<void> {
    // This function needs the template ID, which we'll need to find first
    // For now, we'll implement it in a way that searches through templates
    await handleDbOperation(async () => {
      // Find all templates to locate the question
      const templates = await this.getTestTemplates();

      for (const template of templates) {
        if (!template.questions) continue;

        try {
          let questions = JSON.parse(template.questions as string);
          const originalLength = questions.length;
          questions = questions.filter((q: any) => q.id !== questionId);

          if (questions.length < originalLength) {
            // Question was found and removed
            await this.updateTestTemplate(template.id, {
              questions: JSON.stringify(questions)
            });
            return;
          }
        } catch (error) {
          continue;
        }
      }

      throw new Error('Question not found');
    });
  }

  // Test assignments
  async getTestAssignments(recruiterId?: string, jobSeekerId?: string): Promise<TestAssignment[]> {
    return await handleDbOperation(async () => {
      let conditions: any[] = [];

      if (recruiterId) {
        conditions.push(eq(testAssignments.recruiterId, recruiterId));
      }

      if (jobSeekerId) {
        conditions.push(eq(testAssignments.jobSeekerId, jobSeekerId));
      }

      if (conditions.length > 0) {
        return await this.db.select().from(testAssignments)
          .where(and(...conditions))
          .orderBy(desc(testAssignments.assignedAt));
      } else {
        return await this.db.select().from(testAssignments)
          .orderBy(desc(testAssignments.assignedAt));
      }
    }, []);
  }

  async getTestAssignment(id: number): Promise<TestAssignment | undefined> {
    return await handleDbOperation(async () => {
      const [assignment] = await this.db.select().from(testAssignments).where(eq(testAssignments.id, id));
      return assignment;
    }, undefined);
  }

  async createTestAssignment(assignment: InsertTestAssignment): Promise<TestAssignment> {
    return await handleDbOperation(async () => {
      const [newAssignment] = await this.db.insert(testAssignments).values(assignment).returning();
      return newAssignment;
    });
  }

  async updateTestAssignment(id: number, assignment: Partial<InsertTestAssignment>): Promise<TestAssignment> {
    return await handleDbOperation(async () => {
      const [updatedAssignment] = await this.db
        .update(testAssignments)
        .set({ ...assignment, updatedAt: new Date() })
        .where(eq(testAssignments.id, id))
        .returning();
      return updatedAssignment;
    });
  }

  async deleteTestAssignment(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db.delete(testAssignments).where(eq(testAssignments.id, id));
    });
  }

  // Test retake payments
  async getTestRetakePayments(userId: string): Promise<TestRetakePayment[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(testRetakePayments)
        .where(eq(testRetakePayments.userId, userId))
        .orderBy(desc(testRetakePayments.createdAt));
    }, []);
  }

  async getTestRetakePayment(id: number): Promise<TestRetakePayment | undefined> {
    return await handleDbOperation(async () => {
      const [payment] = await this.db.select().from(testRetakePayments).where(eq(testRetakePayments.id, id));
      return payment;
    }, undefined);
  }

  async createTestRetakePayment(payment: InsertTestRetakePayment): Promise<TestRetakePayment> {
    return await handleDbOperation(async () => {
      const [newPayment] = await this.db.insert(testRetakePayments).values(payment).returning();
      return newPayment;
    });
  }

  async updateTestRetakePayment(id: number, payment: Partial<InsertTestRetakePayment>): Promise<TestRetakePayment> {
    return await handleDbOperation(async () => {
      const [updatedPayment] = await this.db
        .update(testRetakePayments)
        .set({ ...payment, updatedAt: new Date() })
        .where(eq(testRetakePayments.id, id))
        .returning();
      return updatedPayment;
    });
  }

  // Test generation logs for tracking auto-generated tests
  async createTestGenerationLog(log: {
    testTemplateId: number;
    assignmentId: number;
    generatedQuestions: any[];
    generationParams: any;
    totalQuestions: number;
    aptitudeCount: number;
    englishCount: number;
    domainCount: number;
    extremeCount: number;
  }): Promise<any> {
    return await handleDbOperation(async () => {
      const [newLog] = await this.db.insert(testGenerationLogs).values(log).returning();
      return newLog;
    });
  }

  async getTestGenerationLogs(testTemplateId?: number, assignmentId?: number): Promise<any[]> {
    return await handleDbOperation(async () => {
      let conditions: any[] = [];

      if (testTemplateId) {
        conditions.push(eq(testGenerationLogs.testTemplateId, testTemplateId));
      }

      if (assignmentId) {
        conditions.push(eq(testGenerationLogs.assignmentId, assignmentId));
      }

      if (conditions.length > 0) {
        return await this.db.select().from(testGenerationLogs)
          .where(and(...conditions))
          .orderBy(desc(testGenerationLogs.createdAt));
      } else {
        return await this.db.select().from(testGenerationLogs)
          .orderBy(desc(testGenerationLogs.createdAt));
      }
    }, []);
  }

  // Mock interview operations
  async getMockInterviews(userId: string): Promise<MockInterview[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(mockInterviews)
        .where(eq(mockInterviews.userId, userId))
        .orderBy(desc(mockInterviews.createdAt));
    }, []);
  }

  async getMockInterview(id: number): Promise<MockInterview | undefined> {
    return await handleDbOperation(async () => {
      const [interview] = await this.db.select().from(mockInterviews).where(eq(mockInterviews.id, id));
      return interview;
    }, undefined);
  }

  async getMockInterviewBySessionId(sessionId: string, userId?: string): Promise<MockInterview | undefined> {
    return await handleDbOperation(async () => {
      const conditions = [eq(mockInterviews.sessionId, sessionId)];
      if (userId) {
        conditions.push(eq(mockInterviews.userId, userId));
      }
      const [interview] = await this.db.select().from(mockInterviews).where(and(...conditions));
      return interview;
    }, undefined);
  }

  async createMockInterview(interview: InsertMockInterview): Promise<MockInterview> {
    return await handleDbOperation(async () => {
      console.log('🔍 Inserting interview into database:', interview);
      const [newInterview] = await this.db.insert(mockInterviews).values(interview).returning();
      console.log('🔍 Interview inserted, result:', newInterview);
      return newInterview;
    });
  }

  async updateMockInterview(id: number, interview: Partial<InsertMockInterview>): Promise<MockInterview> {
    return await handleDbOperation(async () => {
      const [updatedInterview] = await this.db
        .update(mockInterviews)
        .set({ ...interview, updatedAt: new Date() })
        .where(eq(mockInterviews.id, id))
        .returning();
      return updatedInterview;
    });
  }

  async deleteMockInterview(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db.delete(mockInterviews).where(eq(mockInterviews.id, id));
    });
  }

  // Mock interview questions
  async getMockInterviewQuestions(interviewId: number): Promise<MockInterviewQuestion[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(mockInterviewQuestions)
        .where(eq(mockInterviewQuestions.interviewId, interviewId))
        .orderBy(mockInterviewQuestions.questionNumber);
    }, []);
  }

  async getMockInterviewQuestion(id: number): Promise<MockInterviewQuestion | undefined> {
    return await handleDbOperation(async () => {
      const [question] = await this.db.select().from(mockInterviewQuestions).where(eq(mockInterviewQuestions.id, id));
      return question;
    }, undefined);
  }

  async createMockInterviewQuestion(question: InsertMockInterviewQuestion): Promise<MockInterviewQuestion> {
    return await handleDbOperation(async () => {
      const [newQuestion] = await this.db.insert(mockInterviewQuestions).values(question).returning();
      return newQuestion;
    });
  }

  async updateMockInterviewQuestion(id: number, question: Partial<InsertMockInterviewQuestion>): Promise<MockInterviewQuestion> {
    return await handleDbOperation(async () => {
      const [updatedQuestion] = await this.db
        .update(mockInterviewQuestions)
        .set({ ...question, updatedAt: new Date() })
        .where(eq(mockInterviewQuestions.id, id))
        .returning();
      return updatedQuestion;
    });
  }

  async deleteMockInterviewQuestion(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db.delete(mockInterviewQuestions).where(eq(mockInterviewQuestions.id, id));
    });
  }

  // Interview payments
  async getInterviewPayments(userId: string): Promise<InterviewPayment[]> {
    return await handleDbOperation(async () => {
      return await this.db.select().from(interviewPayments)
        .where(eq(interviewPayments.userId, userId))
        .orderBy(desc(interviewPayments.createdAt));
    }, []);
  }

  async getInterviewPayment(id: number): Promise<InterviewPayment | undefined> {
    return await handleDbOperation(async () => {
      const [payment] = await this.db.select().from(interviewPayments).where(eq(interviewPayments.id, id));
      return payment;
    }, undefined);
  }

  async createInterviewPayment(payment: InsertInterviewPayment): Promise<InterviewPayment> {
    return await handleDbOperation(async () => {
      const [newPayment] = await this.db.insert(interviewPayments).values(payment).returning();
      return newPayment;
    });
  }

  async updateInterviewPayment(id: number, payment: Partial<InsertInterviewPayment>): Promise<InterviewPayment> {
    return await handleDbOperation(async () => {
      const [updatedPayment] = await this.db
        .update(interviewPayments)
        .set({ ...payment, updatedAt: new Date() })
        .where(eq(interviewPayments.id, id))
        .returning();
      return updatedPayment;
    });
  }

  // Question bank operations
  async getQuestionBankQuestions(filters?: { type?: string; difficulty?: string; limit?: number }): Promise<any[]> {
    return await handleDbOperation(async () => {
      const conditions = [eq(questionBank.isActive, true)];

      // Apply filters if provided
      if (filters?.type) {
        conditions.push(eq(questionBank.type, filters.type));
      }
      if (filters?.difficulty) {
        conditions.push(eq(questionBank.difficulty, filters.difficulty));
      }

      let results = await this.db.select()
        .from(questionBank)
        .where(and(...conditions))
        .orderBy(sql`RANDOM()`);

      if (filters?.limit) {
        results = results.slice(0, filters.limit);
      }

      return results;
    }, []);
  }

  // User interview stats
  async getUserInterviewStats(userId: string): Promise<UserInterviewStats | undefined> {
    return await handleDbOperation(async () => {
      let [stats] = await this.db.select().from(userInterviewStats).where(eq(userInterviewStats.userId, userId));

      // If no stats exist, create default stats
      if (!stats) {
        const defaultStats = {
          userId,
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          freeInterviewsUsed: 0,
          bestScore: 0,
          totalTimeSpent: 0
        };

        [stats] = await this.db.insert(userInterviewStats).values(defaultStats).returning();
      }

      return stats;
    }, undefined);
  }

  async upsertUserInterviewStats(stats: InsertUserInterviewStats): Promise<UserInterviewStats> {
    return await handleDbOperation(async () => {
      const [upsertedStats] = await this.db
        .insert(userInterviewStats)
        .values(stats)
        .onConflictDoUpdate({
          target: userInterviewStats.userId,
          set: {
            ...stats,
            updatedAt: new Date(),
          },
        })
        .returning();
      return upsertedStats;
    });
  }

  // ===== CAREER AI ENHANCEMENT IMPLEMENTATIONS =====

  // Skill Progress Logs
  async getUserSkillProgressLogs(userId: string): Promise<SkillProgressLog[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(skillProgressLogs)
        .where(eq(skillProgressLogs.userId, userId))
        .orderBy(desc(skillProgressLogs.recordedAt));
    }, []);
  }

  async addSkillProgressLog(log: InsertSkillProgressLog): Promise<SkillProgressLog> {
    return await handleDbOperation(async () => {
      const [newLog] = await this.db
        .insert(skillProgressLogs)
        .values(log)
        .returning();
      return newLog;
    });
  }

  async getSkillProgressBySkill(userId: string, skill: string): Promise<SkillProgressLog[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(skillProgressLogs)
        .where(and(eq(skillProgressLogs.userId, userId), eq(skillProgressLogs.skill, skill)))
        .orderBy(desc(skillProgressLogs.recordedAt));
    }, []);
  }

  // Achievements System
  async getAchievementsCatalog(category?: string): Promise<AchievementsCatalog[]> {
    return await handleDbOperation(async () => {
      const conditions = [eq(achievementsCatalog.isActive, true)];
      if (category) {
        conditions.push(eq(achievementsCatalog.category, category));
      }
      return await this.db
        .select()
        .from(achievementsCatalog)
        .where(and(...conditions))
        .orderBy(achievementsCatalog.category, achievementsCatalog.points);
    }, []);
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.earnedAt));
    }, []);
  }

  async addUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    return await handleDbOperation(async () => {
      const [newAchievement] = await this.db
        .insert(userAchievements)
        .values(achievement)
        .returning();
      return newAchievement;
    });
  }

  async getUserAchievementPoints(userId: string): Promise<number> {
    return await handleDbOperation(async () => {
      const result = await this.db
        .select({ totalPoints: sql<number>`SUM(${achievementsCatalog.points})` })
        .from(userAchievements)
        .innerJoin(achievementsCatalog, eq(userAchievements.achievementId, achievementsCatalog.id))
        .where(eq(userAchievements.userId, userId));

      return result[0]?.totalPoints || 0;
    }, 0);
  }

  // Learning Resources & Plan
  async getLearningResources(skill?: string, difficulty?: string): Promise<LearningResource[]> {
    return await handleDbOperation(async () => {
      const conditions = [eq(learningResources.isActive, true)];
      if (skill) {
        conditions.push(eq(learningResources.skill, skill));
      }
      if (difficulty) {
        conditions.push(eq(learningResources.difficulty, difficulty));
      }
      return await this.db
        .select()
        .from(learningResources)
        .where(and(...conditions))
        .orderBy(desc(learningResources.rating), learningResources.skill);
    }, []);
  }

  async addLearningResource(resource: InsertLearningResource): Promise<LearningResource> {
    return await handleDbOperation(async () => {
      const [newResource] = await this.db
        .insert(learningResources)
        .values(resource)
        .returning();
      return newResource;
    });
  }

  async getUserLearningPlan(userId: string): Promise<UserLearningPlan[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(userLearningPlan)
        .where(eq(userLearningPlan.userId, userId))
        .orderBy(desc(userLearningPlan.addedAt));
    }, []);
  }

  async addToLearningPlan(plan: InsertUserLearningPlan): Promise<UserLearningPlan> {
    return await handleDbOperation(async () => {
      const [newPlan] = await this.db
        .insert(userLearningPlan)
        .values(plan)
        .returning();
      return newPlan;
    });
  }

  async updateLearningPlanProgress(id: number, progress: number, status?: string): Promise<UserLearningPlan> {
    return await handleDbOperation(async () => {
      const updateData: any = { progress };
      if (status) {
        updateData.status = status;
        if (status === 'in_progress' && !updateData.startedAt) {
          updateData.startedAt = new Date();
        }
        if (status === 'completed') {
          updateData.completedAt = new Date();
        }
      }

      const [updatedPlan] = await this.db
        .update(userLearningPlan)
        .set(updateData)
        .where(eq(userLearningPlan.id, id))
        .returning();
      return updatedPlan;
    });
  }

  // Interview Preparation
  async getUserInterviewPreps(userId: string): Promise<InterviewPrep[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(interviewPreps)
        .where(eq(interviewPreps.userId, userId))
        .orderBy(desc(interviewPreps.lastUsed), desc(interviewPreps.createdAt));
    }, []);
  }

  async createInterviewPrep(prep: InsertInterviewPrep): Promise<InterviewPrep> {
    return await handleDbOperation(async () => {
      const [newPrep] = await this.db
        .insert(interviewPreps)
        .values(prep)
        .returning();
      return newPrep;
    });
  }

  async updateInterviewPrepUsage(id: number): Promise<InterviewPrep> {
    return await handleDbOperation(async () => {
      const [updatedPrep] = await this.db
        .update(interviewPreps)
        .set({
          timesUsed: sql`${interviewPreps.timesUsed} + 1`,
          lastUsed: new Date(),
          updatedAt: new Date()
        })
        .where(eq(interviewPreps.id, id))
        .returning();
      return updatedPrep;
    });
  }

  // Smart Notifications
  async getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]> {
    return await handleDbOperation(async () => {
      const conditions = [eq(notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      return await this.db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    }, []);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return await handleDbOperation(async () => {
      const [newNotification] = await this.db
        .insert(notifications)
        .values(notification)
        .returning();
      return newNotification;
    });
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    return await handleDbOperation(async () => {
      const [updatedNotification] = await this.db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
      return updatedNotification;
    });
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return await handleDbOperation(async () => {
      const result = await this.db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      return result[0]?.count || 0;
    }, 0);
  }

  // Mentorship System
  async getMentorProfiles(skills?: string[], verified?: boolean): Promise<MentorProfile[]> {
    return await handleDbOperation(async () => {
      const conditions = [eq(mentorProfiles.isActive, true)];
      if (verified !== undefined) {
        conditions.push(eq(mentorProfiles.isVerified, verified));
      }

      let query = this.db
        .select()
        .from(mentorProfiles)
        .where(and(...conditions))
        .orderBy(desc(mentorProfiles.rating), desc(mentorProfiles.totalSessions));

      return await query;
    }, []);
  }

  async getUserMentorProfile(userId: string): Promise<MentorProfile | undefined> {
    return await handleDbOperation(async () => {
      const [profile] = await this.db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, userId));
      return profile;
    }, undefined);
  }

  async createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile> {
    return await handleDbOperation(async () => {
      const [newProfile] = await this.db
        .insert(mentorProfiles)
        .values(profile)
        .returning();
      return newProfile;
    });
  }

  async updateMentorProfile(userId: string, updates: Partial<InsertMentorProfile>): Promise<MentorProfile> {
    return await handleDbOperation(async () => {
      const [updatedProfile] = await this.db
        .update(mentorProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(mentorProfiles.userId, userId))
        .returning();
      return updatedProfile;
    });
  }

  async getMentorshipRequests(mentorId?: string, menteeId?: string): Promise<MentorshipRequest[]> {
    return await handleDbOperation(async () => {
      const conditions = [];
      if (mentorId) {
        conditions.push(eq(mentorshipRequests.mentorId, mentorId));
      }
      if (menteeId) {
        conditions.push(eq(mentorshipRequests.menteeId, menteeId));
      }

      if (conditions.length === 0) {
        return await this.db
          .select()
          .from(mentorshipRequests)
          .orderBy(desc(mentorshipRequests.createdAt));
      }

      return await this.db
        .select()
        .from(mentorshipRequests)
        .where(and(...conditions))
        .orderBy(desc(mentorshipRequests.createdAt));
    }, []);
  }

  async createMentorshipRequest(request: InsertMentorshipRequest): Promise<MentorshipRequest> {
    return await handleDbOperation(async () => {
      const [newRequest] = await this.db
        .insert(mentorshipRequests)
        .values(request)
        .returning();
      return newRequest;
    });
  }

  async updateMentorshipRequest(id: number, updates: Partial<InsertMentorshipRequest>): Promise<MentorshipRequest> {
    return await handleDbOperation(async () => {
      const [updatedRequest] = await this.db
        .update(mentorshipRequests)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(mentorshipRequests.id, id))
        .returning();
      return updatedRequest;
    });
  }

  // Career Journey Sharing
  async getSharedJourneys(filters?: { visibility?: string; careerPath?: string; featured?: boolean }): Promise<SharedJourney[]> {
    return await handleDbOperation(async () => {
      const conditions = [eq(sharedJourneys.isApproved, true)];

      if (filters?.visibility) {
        conditions.push(eq(sharedJourneys.visibility, filters.visibility));
      }
      if (filters?.careerPath) {
        conditions.push(eq(sharedJourneys.careerPath, filters.careerPath));
      }
      if (filters?.featured !== undefined) {
        conditions.push(eq(sharedJourneys.isFeatured, filters.featured));
      }

      return await this.db
        .select()
        .from(sharedJourneys)
        .where(and(...conditions))
        .orderBy(desc(sharedJourneys.isFeatured), desc(sharedJourneys.likes), desc(sharedJourneys.createdAt));
    }, []);
  }

  async getUserSharedJourneys(userId: string): Promise<SharedJourney[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(sharedJourneys)
        .where(eq(sharedJourneys.userId, userId))
        .orderBy(desc(sharedJourneys.createdAt));
    }, []);
  }

  async createSharedJourney(journey: InsertSharedJourney): Promise<SharedJourney> {
    return await handleDbOperation(async () => {
      const [newJourney] = await this.db
        .insert(sharedJourneys)
        .values(journey)
        .returning();
      return newJourney;
    });
  }

  async updateSharedJourney(id: number, updates: Partial<InsertSharedJourney>): Promise<SharedJourney> {
    return await handleDbOperation(async () => {
      const [updatedJourney] = await this.db
        .update(sharedJourneys)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(sharedJourneys.id, id))
        .returning();
      return updatedJourney;
    });
  }

  async incrementJourneyViews(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await this.db
        .update(sharedJourneys)
        .set({ views: sql`${sharedJourneys.views} + 1` })
        .where(eq(sharedJourneys.id, id));
    });
  }

  async toggleJourneyLike(id: number): Promise<SharedJourney> {
    return await handleDbOperation(async () => {
      const [journey] = await this.db
        .select()
        .from(sharedJourneys)
        .where(eq(sharedJourneys.id, id));

      const [updated] = await this.db
        .update(sharedJourneys)
        .set({ likes: (journey?.likes || 0) + 1 })
        .where(eq(sharedJourneys.id, id))
        .returning();

      return updated;
    });
  }

  // Community Challenges
  async getActiveChallenges(): Promise<Challenge[]> {
    return await handleDbOperation(async () => {
      const now = new Date();
      return await this.db
        .select()
        .from(challenges)
        .where(and(
          eq(challenges.isActive, true),
          lt(challenges.startAt, now),
          sql`${challenges.endAt} > ${now}`
        ))
        .orderBy(challenges.endAt);
    }, []);
  }

  async getUserChallenges(userId: string): Promise<ChallengeParticipant[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(challengeParticipants)
        .where(eq(challengeParticipants.userId, userId))
        .orderBy(desc(challengeParticipants.joinedAt));
    }, []);
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    return await handleDbOperation(async () => {
      const [newChallenge] = await this.db
        .insert(challenges)
        .values(challenge)
        .returning();
      return newChallenge;
    });
  }

  async joinChallenge(participation: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    return await handleDbOperation(async () => {
      const [newParticipation] = await this.db
        .insert(challengeParticipants)
        .values(participation)
        .returning();

      // Increment participant count
      await this.db
        .update(challenges)
        .set({ currentParticipants: sql`${challenges.currentParticipants} + 1` })
        .where(eq(challenges.id, participation.challengeId));

      return newParticipation;
    });
  }

  async updateChallengeProgress(id: number, progress: object, currentCount: number): Promise<ChallengeParticipant> {
    return await handleDbOperation(async () => {
      const [updatedParticipation] = await this.db
        .update(challengeParticipants)
        .set({
          progress,
          currentCount,
          isCompleted: currentCount >= (progress.targetCount || 0),
          completedAt: currentCount >= (progress.targetCount || 0) ? new Date() : null
        })
        .where(eq(challengeParticipants.id, id))
        .returning();
      return updatedParticipation;
    });
  }

  async getChallengeLeaderboard(challengeId: number): Promise<ChallengeParticipant[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(challengeParticipants)
        .where(eq(challengeParticipants.challengeId, challengeId))
        .orderBy(desc(challengeParticipants.currentCount), challengeParticipants.joinedAt);
    }, []);
  }

  // ===== BIDDER SYSTEM IMPLEMENTATIONS =====

  // Bidder registration operations
  async getBidderRegistration(userId: string): Promise<SelectBidderRegistration | undefined> {
    return await handleDbOperation(async () => {
      const [registration] = await this.db
        .select()
        .from(bidderRegistrations)
        .where(eq(bidderRegistrations.userId, userId));
      return registration;
    }, undefined);
  }

  async createBidderRegistration(registration: InsertBidderRegistration): Promise<SelectBidderRegistration> {
    return await handleDbOperation(async () => {
      const [newRegistration] = await this.db
        .insert(bidderRegistrations)
        .values(registration)
        .returning();
      return newRegistration;
    });
  }

  async updateBidderRegistration(userId: string, updates: Partial<InsertBidderRegistration>): Promise<SelectBidderRegistration> {
    return await handleDbOperation(async () => {
      const [updatedRegistration] = await this.db
        .update(bidderRegistrations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(bidderRegistrations.userId, userId))
        .returning();
      return updatedRegistration;
    });
  }

  // Project operations
  async getProjects(filters?: { status?: string; type?: string; category?: string }): Promise<SelectProject[]> {
    return await handleDbOperation(async () => {
      let query = this.db.select().from(projects);

      if (filters) {
        const conditions = [];
        if (filters.status) conditions.push(eq(projects.status, filters.status));
        if (filters.type) conditions.push(eq(projects.type, filters.type));
        if (filters.category) conditions.push(eq(projects.category, filters.category));

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }

      return await query.orderBy(desc(projects.createdAt));
    }, []);
  }

  async getProject(id: number): Promise<SelectProject | undefined> {
    return await handleDbOperation(async () => {
      const [project] = await this.db
        .select()
        .from(projects)
        .where(eq(projects.id, id));
      return project;
    }, undefined);
  }

  async getUserProjects(userId: string): Promise<SelectProject[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.createdAt));
    }, []);
  }

  async createProject(project: InsertProject): Promise<SelectProject> {
    return await handleDbOperation(async () => {
      const [newProject] = await this.db
        .insert(projects)
        .values(project)
        .returning();
      return newProject;
    });
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<SelectProject> {
    return await handleDbOperation(async () => {
      const [updatedProject] = await this.db
        .update(projects)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      return updatedProject;
    });
  }

  async deleteProject(id: number): Promise<void> {
    return await handleDbOperation(async () => {
      await this.db.delete(projects).where(eq(projects.id, id));
    });
  }

  // Bid operations
  async getProjectBids(projectId: number): Promise<SelectBid[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(bids)
        .where(eq(bids.projectId, projectId))
        .orderBy(asc(bids.amount)); // Order by lowest bid first
    }, []);
  }

  async getUserBids(userId: string): Promise<SelectBid[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(bids)
        .where(eq(bids.bidderId, userId))
        .orderBy(desc(bids.submittedAt));
    }, []);
  }

  async getBid(id: number): Promise<SelectBid | undefined> {
    return await handleDbOperation(async () => {
      const [bid] = await this.db
        .select()
        .from(bids)
        .where(eq(bids.id, id));
      return bid;
    }, undefined);
  }

  async createBid(bid: InsertBid): Promise<SelectBid> {
    return await handleDbOperation(async () => {
      const [newBid] = await this.db
        .insert(bids)
        .values(bid)
        .returning();
      return newBid;
    });
  }

  async updateBid(id: number, updates: Partial<InsertBid>): Promise<SelectBid> {
    return await handleDbOperation(async () => {
      const [updatedBid] = await this.db
        .update(bids)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(bids.id, id))
        .returning();
      return updatedBid;
    });
  }

  async deleteBid(id: number): Promise<void> {
    return await handleDbOperation(async () => {
      await this.db.delete(bids).where(eq(bids.id, id));
    });
  }

  async acceptBid(bidId: number): Promise<SelectBid> {
    return await handleDbOperation(async () => {
      // Get the bid first
      const [bid] = await this.db.select().from(bids).where(eq(bids.id, bidId));
      if (!bid) throw new Error('Bid not found');

      // Reject all other bids for this project
      await this.db
        .update(bids)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(and(eq(bids.projectId, bid.projectId), ne(bids.id, bidId)));

      // Accept this bid
      const [acceptedBid] = await this.db
        .update(bids)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(bids.id, bidId))
        .returning();

      // Update project with selected bidder
      await this.db
        .update(projects)
        .set({
          selectedBidderId: bid.bidderId,
          selectedBidAmount: bid.amount,
          status: 'in_progress',
          startDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(projects.id, bid.projectId));

      return acceptedBid;
    });
  }

  // Project payment operations
  async getProjectPayment(projectId: number): Promise<SelectProjectPayment | undefined> {
    return await handleDbOperation(async () => {
      const [payment] = await this.db
        .select()
        .from(projectPayments)
        .where(eq(projectPayments.projectId, projectId));
      return payment;
    }, undefined);
  }

  async createProjectPayment(payment: InsertProjectPayment): Promise<SelectProjectPayment> {
    return await handleDbOperation(async () => {
      const [newPayment] = await this.db
        .insert(projectPayments)
        .values(payment)
        .returning();
      return newPayment;
    });
  }

  async updateProjectPayment(id: number, updates: Partial<InsertProjectPayment>): Promise<SelectProjectPayment> {
    return await handleDbOperation(async () => {
      const [updatedPayment] = await this.db
        .update(projectPayments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(projectPayments.id, id))
        .returning();
      return updatedPayment;
    });
  }

  // Project milestone operations
  async getProjectMilestones(projectId: number): Promise<SelectProjectMilestone[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(projectMilestones)
        .where(eq(projectMilestones.projectId, projectId))
        .orderBy(asc(projectMilestones.dueDate));
    }, []);
  }

  async createProjectMilestone(milestone: InsertProjectMilestone): Promise<SelectProjectMilestone> {
    return await handleDbOperation(async () => {
      const [newMilestone] = await this.db
        .insert(projectMilestones)
        .values(milestone)
        .returning();
      return newMilestone;
    });
  }

  async updateProjectMilestone(id: number, updates: Partial<InsertProjectMilestone>): Promise<SelectProjectMilestone> {
    return await handleDbOperation(async () => {
      const [updatedMilestone] = await this.db
        .update(projectMilestones)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(projectMilestones.id, id))
        .returning();
      return updatedMilestone;
    });
  }

  // ===== ADVANCED ASSESSMENT IMPLEMENTATIONS =====
  async createVideoInterview(data: InsertVideoInterview): Promise<VideoInterview> {
    return await handleDbOperation(async () => {
      const [interview] = await this.db.insert(videoInterviews).values({
        candidateId: data.candidateId,
        recruiterId: data.recruiterId,
        jobId: data.jobId,
        questions: data.questions,
        totalTimeLimit: data.totalTimeLimit,
        expiryDate: data.expiryDate,
        status: data.status,
        createdAt: new Date()
      }).returning();
      return interview;
    });
  }

  async createVideoResponse(data: InsertVideoResponse): Promise<VideoResponse> {
    return await handleDbOperation(async () => {
      const [response] = await this.db.insert(videoResponses).values({
        interviewId: data.interviewId,
        questionId: data.questionId,
        videoPath: data.videoPath,
        duration: data.duration,
        attempts: data.attempts,
        deviceInfo: data.deviceInfo,
        uploadedAt: data.uploadedAt
      }).returning();
      return response;
    });
  }

  async getVideoInterview(id: number): Promise<VideoInterview | undefined> {
    return await handleDbOperation(async () => {
      const [interview] = await this.db
        .select()
        .from(videoInterviews)
        .where(eq(videoInterviews.id, id));
      return interview;
    }, undefined);
  }

  async getVideoResponse(id: number): Promise<VideoResponse | undefined> {
    return await handleDbOperation(async () => {
      const [response] = await this.db
        .select()
        .from(videoResponses)
        .where(eq(videoResponses.id, id));
      return response;
    }, undefined);
  }

  async getVideoResponses(interviewId: number): Promise<VideoResponse[]> {
    return await handleDbOperation(async () => {
      return await this.db
        .select()
        .from(videoResponses)
        .where(eq(videoResponses.interviewId, interviewId));
    }, []);
  }

  async updateVideoResponse(id: number, data: Partial<InsertVideoResponse>): Promise<VideoResponse> {
    return await handleDbOperation(async () => {
      const [response] = await this.db
        .update(videoResponses)
        .set(data)
        .where(eq(videoResponses.id, id))
        .returning();
      return response;
    });
  }

  async updateVideoInterview(id: number, data: Partial<InsertVideoInterview>): Promise<VideoInterview> {
    return await handleDbOperation(async () => {
      const [interview] = await this.db
        .update(videoInterviews)
        .set(data)
        .where(eq(videoInterviews.id, id))
        .returning();
      return interview;
    });
  }

  async createSimulationAssessment(data: InsertSimulationAssessment): Promise<SimulationAssessment> {
    return await handleDbOperation(async () => {
      const [assessment] = await this.db.insert(simulationAssessments).values({
        candidateId: data.candidateId,
        recruiterId: data.recruiterId,
        jobId: data.jobId,
        scenarioId: data.scenarioId,
        scenario: data.scenario,
        status: data.status,
        expiryDate: data.expiryDate,
        createdAt: new Date()
      }).returning();
      return assessment;
    });
  }

  async getSimulationAssessment(id: number): Promise<SimulationAssessment | undefined> {
    return await handleDbOperation(async () => {
      const [assessment] = await this.db
        .select()
        .from(simulationAssessments)
        .where(eq(simulationAssessments.id, id));
      return assessment;
    }, undefined);
  }

  async updateSimulationAssessment(id: number, data: Partial<InsertSimulationAssessment>): Promise<SimulationAssessment> {
    return await handleDbOperation(async () => {
      const [assessment] = await this.db
        .update(simulationAssessments)
        .set(data)
        .where(eq(simulationAssessments.id, id))
        .returning();
      return assessment;
    });
  }

  async createPersonalityAssessment(data: InsertPersonalityAssessment): Promise<PersonalityAssessment> {
    return await handleDbOperation(async () => {
      const [assessment] = await this.db.insert(personalityAssessments).values({
        candidateId: data.candidateId,
        recruiterId: data.recruiterId,
        jobId: data.jobId,
        assessmentType: data.assessmentType,
        questions: data.questions,
        timeLimit: data.timeLimit,
        jobRole: data.jobRole,
        industry: data.industry,
        status: data.status,
        expiryDate: data.expiryDate,
        createdAt: new Date()
      }).returning();
      return assessment;
    });
  }

  async getPersonalityAssessment(id: number): Promise<PersonalityAssessment | undefined> {
    return await handleDbOperation(async () => {
      const [assessment] = await this.db
        .select()
        .from(personalityAssessments)
        .where(eq(personalityAssessments.id, id));
      return assessment;
    }, undefined);
  }

  async updatePersonalityAssessment(id: number, data: Partial<InsertPersonalityAssessment>): Promise<PersonalityAssessment> {
    return await handleDbOperation(async () => {
      const [assessment] = await this.db
        .update(personalityAssessments)
        .set(data)
        .where(eq(personalityAssessments.id, id))
        .returning();
      return assessment;
    });
  }

  async createSkillsVerification(data: InsertSkillsVerification): Promise<SkillsVerification> {
    return await handleDbOperation(async () => {
      const [verification] = await this.db.insert(skillsVerifications).values({
        candidateId: data.candidateId,
        recruiterId: data.recruiterId,
        jobId: data.jobId,
        projectTemplateId: data.projectTemplateId,
        projectTemplate: data.projectTemplate,
        status: data.status,
        timeLimit: data.timeLimit,
        expiryDate: data.expiryDate,
        customizations: data.customizations,
        createdAt: new Date()
      }).returning();
      return verification;
    });
  }

  async getSkillsVerification(id: number): Promise<SkillsVerification | undefined> {
    return await handleDbOperation(async () => {
      const [verification] = await this.db
        .select()
        .from(skillsVerifications)
        .where(eq(skillsVerifications.id, id));
      return verification;
    }, undefined);
  }

  async updateSkillsVerification(id: number, data: Partial<InsertSkillsVerification>): Promise<SkillsVerification> {
    return await handleDbOperation(async () => {
      const [verification] = await this.db
        .update(skillsVerifications)
        .set(data)
        .where(eq(skillsVerifications.id, id))
        .returning();
      return verification;
    });
  }

  // Skills verification deliverable submissions - using in-memory storage for now
  private deliverableSubmissions: Map<number, any[]> = new Map();

  async createDeliverableSubmission(submission: {
    skillsVerificationId: number;
    deliverableId: string;
    filePath: string;
    fileName: string;
    fileType: string;
    metadata: any;
  }): Promise<any> {
    return await handleDbOperation(async () => {
      const submissionData = {
        id: Date.now(), // Simple ID generation for now
        ...submission,
        uploadedAt: new Date(),
      };

      const existing = this.deliverableSubmissions.get(submission.skillsVerificationId) || [];
      existing.push(submissionData);
      this.deliverableSubmissions.set(submission.skillsVerificationId, existing);

      return submissionData;
    });
  }

  async getDeliverableSubmissions(skillsVerificationId: number): Promise<any[]> {
    return await handleDbOperation(async () => {
      return this.deliverableSubmissions.get(skillsVerificationId) || [];
    }, []);
  }
}

export const storage = new DatabaseStorage();