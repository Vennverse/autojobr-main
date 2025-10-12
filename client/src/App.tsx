import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import EnhancedDashboard from "@/pages/enhanced-dashboard";
import Profile from "@/pages/profile";
import Applications from "@/pages/applications";
import Jobs from "@/pages/jobs";
import Internships from "@/pages/internships";
import Subscription from "@/pages/subscription";
import JobSeekerPremium from "@/pages/JobSeekerPremium";
import RecruiterPremium from "@/pages/RecruiterPremium";
import RecruiterSubscription from "@/pages/recruiter-subscription";
import Onboarding from "@/pages/onboarding";
import Landing from "@/pages/landing";
import UserTypeSelection from "@/pages/user-type-selection";
import UnifiedRecruiterDashboard from "@/pages/unified-recruiter-dashboard";
import UnifiedCrmDashboard from "@/pages/unified-crm-dashboard";
import RecruiterAutoLogin from "@/pages/recruiter-auto-login";
import PostJob from "@/pages/post-job";
import VerifyEmail from "@/pages/verify-email";
import EmailVerificationPage from "@/pages/email-verification";
import ViewJob from "@/pages/view-job";
import EditJob from "@/pages/edit-job";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import SimpleChatPage from "@/pages/simple-chat";
import ResumesPage from "@/pages/resumes";
import JobDiscoveryPage from "@/pages/job-discovery-simple";
import PremiumTargetingPage from "@/pages/premium-targeting";
import JobPromotionPayment from "@/pages/job-promotion-payment";
import TestManagement from "@/pages/test-management";
import TestAssignments from "@/pages/test-assignments";
import TestTaking from "@/pages/test-taking";
import JobSeekerTests from "@/pages/job-seeker-tests";
import TestRetakePayment from "@/pages/test-retake-payment";
import PremiumTargetingPayment from "@/pages/premium-targeting-payment";
import QuestionBuilder from "@/pages/question-builder";
import RecruiterFeatures from "@/pages/recruiter-features";
import QuestionBank from "@/pages/question-bank";
import QuestionBankAdmin from "@/pages/admin/question-bank";
import AdminJobSpyPage from "@/pages/admin-jobspy";
// Import Dashboard for the missing reference
import Dashboard from "@/pages/dashboard";
import QuickLogin from "@/pages/quick-login";

import CareerAIAssistant from "@/pages/career-ai-assistant";
import RankingTests from "@/pages/ranking-tests";
import MockInterview from "@/pages/mock-interview";
import MockInterviewSession from "@/pages/mock-interview-session";
import MockInterviewResults from "@/pages/mock-interview-results";
import VirtualInterviewStart from "@/pages/VirtualInterviewStart";
import VirtualInterview from "@/pages/VirtualInterview";
import ChatInterview from "@/pages/ChatInterview";
import VirtualInterviewComplete from "@/pages/VirtualInterviewComplete";
import VirtualInterviewFeedback from "@/pages/VirtualInterviewFeedback";
import InterviewAssignments from "@/pages/InterviewAssignments";
import InterviewInvite from "@/pages/interview-invite";
import PipelineManagement from "@/pages/PipelineManagement";
import ApplicantsPage from "@/pages/modern-recruiter-dashboard";
import EnhancedPipelineManagement from "@/pages/enhanced-pipeline-management";
import TaskManagement from "@/pages/task-management";
import JobSeekerTasks from "@/pages/job-seeker-tasks";
import ReferralMarketplace from "@/pages/referral-marketplace";
import BecomeReferrer from "@/pages/become-referrer";
import EmployeeReferralServices from "@/pages/employee-referral-services";
import MyBookings from "@/pages/my-bookings";
import AdvancedAnalyticsDashboard from "@/pages/advanced-analytics-dashboard";
import BackgroundCheckIntegration from "@/pages/background-check-integration";
import SSOConfiguration from "@/pages/sso-configuration";
import SubscriptionSuccess from "@/pages/subscription/Success";
import SubscriptionCancel from "@/pages/subscription/Cancel";
import RecruiterSettings from "@/pages/recruiter/settings";
import RecruiterBilling from "@/pages/recruiter/billing";
import RecruiterProfile from "@/pages/recruiter/profile";
import BidderDashboard from "@/pages/bidder-dashboard";
import BidderLanding from "@/pages/bidder-landing";
import BidderProfile from "@/pages/bidder-profile";
import InterviewLink from "@/pages/InterviewLink";
import VideoPractice from "@/pages/VideoPractice";

// SEO Landing Pages to Beat Competition
import FreeJobApplicationAutomation from "@/pages/seo/FreeJobApplicationAutomation";
import BestJobApplicationTools from "@/pages/seo/BestJobApplicationTools";
import RemoteJobsStudents from "@/pages/seo/RemoteJobsStudents";
import OneClickApplyJobs from "@/pages/seo/OneClickApplyJobs";
import JobApplicationAutofillExtension from "@/pages/seo/JobApplicationAutofillExtension";

// Public Pages
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Blog from "@/pages/blog";
import ChromeExtension from "@/pages/chrome-extension";
import ATSOptimizer from "@/pages/ats-optimizer";
import PrivacyPolicy from "@/pages/privacy-policy";

// Blog Articles
import BeatATSGuide from "@/pages/blog/beat-ats-systems-2025-guide";
import LinkedInAutomationGuide from "@/pages/blog/linkedin-automation-guide";
import AICoverLettersGuide from "@/pages/blog/ai-cover-letters-guide";
import RemoteJobSearch2025 from "@/pages/blog/remote-job-search-2025";
import JobAlertsPage from "@/pages/job-alerts";
import CompanyCareerPage from "@/pages/company-career-page";

// Import RankingTestTaking component
import RankingTestTaking from './pages/ranking-test-taking';

// Import lazy for dynamic imports
import { lazy } from "react";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();

  // ENTERPRISE-GRADE: Client-side security and session validation
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Clear all cached data if user is not authenticated
      const protectedRoutes = ['/dashboard', '/profile', '/applications', '/jobs', '/resumes', '/recruiter'];
      const isProtectedRoute = protectedRoutes.some(route => location.startsWith(route));

      if (isProtectedRoute) {
        console.log('🚨 [SECURITY] Unauthenticated access detected - full cleanup initiated');

        // CRITICAL: Clear ALL browser state
        queryClient.clear();
        sessionStorage.clear();

        // Clear localStorage but preserve theme
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);

        // Force hard redirect to clear any lingering state
        window.location.href = '/auth?reason=session_expired&t=' + Date.now();
      }
    }

    // CRITICAL: Validate user data integrity on every auth state change
    if (isAuthenticated && user) {
      const currentUserId = user.id;
      const cachedUserId = sessionStorage.getItem('current_user_id');

      // Check for session mismatch (potential security issue)
      if (cachedUserId && cachedUserId !== currentUserId) {
        console.error('🚨 [SECURITY] User ID mismatch detected - forcing logout');
        queryClient.clear();
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/auth?reason=security_violation&t=' + Date.now();
        return;
      }

      // Store current user ID for validation
      sessionStorage.setItem('current_user_id', currentUserId);
    }
  }, [isAuthenticated, isLoading, location, queryClient, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/quick-login" component={QuickLogin} />
      <Route path="/recruiter-login" component={RecruiterAutoLogin} />
      <Route path="/interview-invite/:token" component={InterviewInvite} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* Subscription success/cancel routes */}
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/subscription/cancel" component={SubscriptionCancel} />

      {/* Public Pages - Available to Everyone */}
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/cancellation-refund" component={lazy(() => import("./pages/cancellation-refund"))} />
      <Route path="/terms-conditions" component={lazy(() => import("./pages/terms-conditions"))} />
      <Route path="/shipping-policy" component={lazy(() => import("./pages/shipping-policy"))} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/beat-ats-systems-2025-guide" component={BeatATSGuide} />
      <Route path="/blog/linkedin-automation-guide" component={LinkedInAutomationGuide} />
      <Route path="/blog/ai-cover-letters-guide" component={AICoverLettersGuide} />
      <Route path="/blog/remote-job-search-2025" component={RemoteJobSearch2025} />
      <Route path="/chrome-extension" component={ChromeExtension} />
      <Route path="/ats-optimizer" component={ATSOptimizer} />

      {/* SEO-optimized referral landing page */}
      <Route path="/employee-referral-services" component={EmployeeReferralServices} />
      <Route path="/job-referrals" component={EmployeeReferralServices} />
      <Route path="/internal-referrals" component={EmployeeReferralServices} />
      <Route path="/tech-company-referrals" component={EmployeeReferralServices} />
      <Route path="/google-referral" component={EmployeeReferralServices} />
      <Route path="/microsoft-referral" component={EmployeeReferralServices} />
      <Route path="/amazon-referral" component={EmployeeReferralServices} />
      <Route path="/apple-referral" component={EmployeeReferralServices} />

      {/* High-Value SEO Landing Pages to Beat Competition */}
      <Route path="/free-job-application-automation" component={FreeJobApplicationAutomation} />
      <Route path="/beat-ats-systems-free" component={ATSOptimizer} />
      <Route path="/auto-apply-1000-jobs-daily" component={FreeJobApplicationAutomation} />
      <Route path="/linkedin-auto-apply-bot" component={ChromeExtension} />
      <Route path="/indeed-auto-apply-tool" component={ChromeExtension} />

      {/* Strategic Long-Tail SEO Pages */}
      <Route path="/best-job-application-tools-2025" component={BestJobApplicationTools} />
      <Route path="/remote-jobs-students-2025" component={RemoteJobsStudents} />
      <Route path="/1-click-apply-jobs" component={OneClickApplyJobs} />
      <Route path="/freshers-remote-jobs-2025" component={RemoteJobsStudents} />
      <Route path="/linkedin-job-application-autofill-tool" component={JobApplicationAutofillExtension} />
      <Route path="/ai-job-application-tracker-free" component={BestJobApplicationTools} />
      <Route path="/how-to-apply-jobs-faster-online" component={OneClickApplyJobs} />
      <Route path="/job-application-autofill-extension" component={JobApplicationAutofillExtension} />

      {/* Additional High-Traffic Keyword Routes */}
      <Route path="/entry-level-jobs-no-experience" component={RemoteJobsStudents} />
      <Route path="/college-student-jobs-remote" component={RemoteJobsStudents} />
      <Route path="/part-time-jobs-students-online" component={RemoteJobsStudents} />
      <Route path="/automated-job-search-tool" component={BestJobApplicationTools} />
      <Route path="/job-search-automation-software" component={BestJobApplicationTools} />
      <Route path="/resume-optimizer-ats-free" component={ATSOptimizer} />

      {/* Post Job route - accessible to everyone, handles verification internally */}
      <Route path="/post-job" component={PostJob} />

      {/* Public job pages - accessible to everyone for discovery */}
      <Route path="/jobs" component={Jobs} />

      {/* Clean URL routes for job categories */}
      <Route path="/jobs/technology" component={() => <Jobs category="technology" />} />
      <Route path="/jobs/engineering" component={() => <Jobs category="engineering" />} />
      <Route path="/jobs/marketing" component={() => <Jobs category="marketing" />} />
      <Route path="/jobs/sales" component={() => <Jobs category="sales" />} />
      <Route path="/jobs/design" component={() => <Jobs category="design" />} />
      <Route path="/jobs/data-science" component={() => <Jobs category="data-science" />} />
      <Route path="/jobs/product-management" component={() => <Jobs category="product-management" />} />
      <Route path="/jobs/finance" component={() => <Jobs category="finance" />} />
      <Route path="/jobs/operations" component={() => <Jobs category="operations" />} />
      <Route path="/jobs/human-resources" component={() => <Jobs category="human-resources" />} />
      <Route path="/jobs/customer-success" component={() => <Jobs category="customer-success" />} />
      <Route path="/jobs/remote" component={() => <Jobs workMode="remote" />} />

      {/* Clean URL routes for job locations */}
      <Route path="/jobs/san-francisco" component={() => <Jobs location="san-francisco" />} />
      <Route path="/jobs/new-york" component={() => <Jobs location="new-york" />} />
      <Route path="/jobs/austin" component={() => <Jobs location="austin" />} />
      <Route path="/jobs/seattle" component={() => <Jobs location="seattle" />} />
      <Route path="/jobs/los-angeles" component={() => <Jobs location="los-angeles" />} />
      <Route path="/jobs/chicago" component={() => <Jobs location="chicago" />} />
      <Route path="/jobs/atlanta" component={() => <Jobs location="atlanta" />} />
      <Route path="/jobs/boston" component={() => <Jobs location="boston" />} />
      <Route path="/jobs/denver" component={() => <Jobs location="denver" />} />
      <Route path="/jobs/dallas" component={() => <Jobs location="dallas" />} />

      {/* International locations */}
      <Route path="/jobs/london" component={() => <Jobs location="london" />} />
      <Route path="/jobs/toronto" component={() => <Jobs location="toronto" />} />
      <Route path="/jobs/sydney" component={() => <Jobs location="sydney" />} />
      <Route path="/jobs/berlin" component={() => <Jobs location="berlin" />} />
      <Route path="/jobs/amsterdam" component={() => <Jobs location="amsterdam" />} />
      <Route path="/jobs/singapore" component={() => <Jobs location="singapore" />} />
      <Route path="/jobs/mumbai" component={() => <Jobs location="mumbai" />} />
      <Route path="/jobs/bangalore" component={() => <Jobs location="bangalore" />} />
      <Route path="/jobs/dublin" component={() => <Jobs location="dublin" />} />
      <Route path="/jobs/stockholm" component={() => <Jobs location="stockholm" />} />

      {/* Country-level routes */}
      <Route path="/jobs/usa" component={() => <Jobs country="usa" />} />
      <Route path="/jobs/canada" component={() => <Jobs country="canada" />} />
      <Route path="/jobs/uk" component={() => <Jobs country="uk" />} />
      <Route path="/jobs/germany" component={() => <Jobs country="germany" />} />
      <Route path="/jobs/australia" component={() => <Jobs country="australia" />} />
      <Route path="/jobs/india" component={() => <Jobs country="india" />} />
      <Route path="/jobs/singapore-country" component={() => <Jobs country="singapore" />} />
      <Route path="/jobs/netherlands" component={() => <Jobs country="netherlands" />} />
      <Route path="/jobs/sweden" component={() => <Jobs country="sweden" />} />

      <Route path="/jobs/:id" component={ViewJob} />

      {/* Company career pages - accessible to everyone */}
      <Route path="/career/:companyName" component={CompanyCareerPage} />
      <Route path="/careers/:companyName" component={CompanyCareerPage} />

      {/* Public internship pages - accessible to everyone for discovery */}
      <Route path="/internships" component={Internships} />

      {isAuthenticated ? (
        <>
          {/* Handle different user types */}
          {user?.currentRole === 'recruiter' || user?.userType === 'recruiter' || user?.userType === 'admin' || (user?.currentRole === 'autojobr' && user?.userType === 'recruiter') ? (
            <>
              <Route path="/" component={UnifiedRecruiterDashboard} />
              <Route path="/recruiter-dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/recruiter/dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/enhanced-dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/advanced-dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/recruiter/post-job" component={PostJob} />
              <Route path="/recruiter/edit-job/:id" component={EditJob} />
              <Route path="/premium-targeting" component={PremiumTargetingPage} />
              <Route path="/premium-targeting-payment" component={PremiumTargetingPayment} />
              <Route path="/job-promotion-payment/:id" component={JobPromotionPayment} />
              <Route path="/recruiter/premium" component={RecruiterPremium} />
              <Route path="/test-assignments" component={TestAssignments} />
              <Route path="/recruiter/test-management" component={TestManagement} />
              <Route path="/recruiter/test-assignments" component={TestAssignments} />
              <Route path="/recruiter/question-builder/:templateId">
                {(params) => <QuestionBuilder templateId={parseInt(params.templateId)} />}
              </Route>
              <Route path="/recruiter/question-bank" component={QuestionBank} />
              <Route path="/admin/question-bank" component={QuestionBankAdmin} />
              <Route path="/admin/jobspy" component={AdminJobSpyPage} />
              <Route path="/recruiter/interview-assignments" component={InterviewAssignments} />
              <Route path="/recruiter/applicants" component={ApplicantsPage} />
              <Route path="/recruiter/pipeline" component={PipelineManagement} />
              <Route path="/recruiter/enhanced-pipeline" component={EnhancedPipelineManagement} />
              <Route path="/recruiter/tasks" component={TaskManagement} />
              <Route path="/recruiter/background-checks" component={BackgroundCheckIntegration} />
              <Route path="/recruiter/settings" component={RecruiterSettings} />
              <Route path="/recruiter/billing" component={RecruiterBilling} />
              <Route path="/recruiter/profile" component={RecruiterProfile} />
              <Route path="/admin/sso-configuration" component={SSOConfiguration} />
              {/* Admin user management temporarily disabled */}
              <Route path="/jobs/:id" component={ViewJob} />
              <Route path="/profile" component={Profile} />
              <Route path="/subscription" component={RecruiterSubscription} />
              <Route path="/recruiter-premium" component={RecruiterPremium} />
              <Route path="/chat" component={SimpleChatPage} />
              <Route path="/messaging" component={SimpleChatPage} />
              <Route path="/bidder-dashboard" component={BidderDashboard} />
              <Route path="/bidder-profile" component={BidderProfile} />
              <Route path="/job-seeker-view" component={Dashboard} />
            </>
          ) : user?.userType === 'job_seeker' ? (
            <>
              {/* Job seeker routes - check onboarding status */}
              {user?.onboardingCompleted === false ? (
                <>
                  <Route path="/onboarding" component={Onboarding} />
                  <Route path="/" component={Onboarding} />
                </>
              ) : (
                <>
                  {/* Main dashboard routes for completed job seekers */}
                  <Route path="/" component={EnhancedDashboard} />
                  <Route path="/dashboard" component={EnhancedDashboard} />
                  <Route path="/enhanced-dashboard" component={EnhancedDashboard} />
                  <Route path="/unified-crm-dashboard" component={UnifiedCrmDashboard} />
                  <Route path="/onboarding" component={Onboarding} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/resumes" component={ResumesPage} />
                  <Route path="/applications" component={Applications} />
                  <Route path="/jobs" component={Jobs} />

                  <Route path="/discover" component={JobDiscoveryPage} />
                  <Route path="/job-seeker-tests" component={JobSeekerTests} />
                  <Route path="/job-seeker/tests" component={JobSeekerTests} />
                  <Route path="/ranking-tests" component={RankingTests} />
                  <Route path="/ranking-test/:id" component={RankingTestTaking} />
                  <Route path="/test/:id" component={TestTaking} />
                  <Route path="/test/:id/retake-payment">
                    {(params) => <TestRetakePayment />}
                  </Route>
                  <Route path="/mock-interview" component={MockInterview} />
                  <Route path="/mock-interview/session/:sessionId" component={MockInterviewSession} />
                  <Route path="/mock-interview/results/:sessionId" component={MockInterviewResults} />
                  <Route path="/mock-interview/:sessionId" component={MockInterviewSession} />
                  <Route path="/virtual-interview-start" component={VirtualInterviewStart} />
                  <Route path="/virtual-interview/start" component={VirtualInterviewStart} />
                  <Route path="/virtual-interview/new" component={VirtualInterviewStart} />
                  <Route path="/virtual-interview-complete/:sessionId" component={VirtualInterviewComplete} />
                  <Route path="/virtual-interview/:sessionId/feedback" component={VirtualInterviewFeedback} />
                  <Route path="/virtual-interview/:sessionId" component={VirtualInterview} />
                  <Route path="/chat-interview/:sessionId" component={ChatInterview} />
                  <Route path="/interview-link/:linkId" component={InterviewLink} />
                  <Route path="/test-taking/:id" component={TestTaking} />
                  <Route path="/subscription" component={Subscription} />
                  <Route path="/job-seeker-premium" component={JobSeekerPremium} />
                  <Route path="/career-ai-assistant" component={CareerAIAssistant} />
                  <Route path="/referral-marketplace" component={ReferralMarketplace} />
                  <Route path="/become-referrer" component={BecomeReferrer} />
                  <Route path="/my-bookings" component={MyBookings} />
                  <Route path="/job-alerts" component={JobAlertsPage} />
                  <Route path="/bidder-dashboard" component={BidderDashboard} />
                  <Route path="/bidder-profile" component={BidderProfile} />
                  <Route path="/chat" component={SimpleChatPage} />
                  <Route path="/messaging" component={SimpleChatPage} />
                  {/* AI Video Interview Practice Route */}
                  <Route path="/video-practice" component={VideoPractice} />
                  <Route path="/video-practice/feedback/:sessionId" component={VirtualInterviewFeedback} />
                </>
              )}
            </>
          ) : (
            <>
              {/* Default routes for users without explicit type (treat as job seekers) */}
              <Route path="/" component={EnhancedDashboard} />
              <Route path="/dashboard" component={EnhancedDashboard} />
              <Route path="/enhanced-dashboard" component={EnhancedDashboard} />
              <Route path="/unified-crm-dashboard" component={UnifiedCrmDashboard} />
              <Route path="/onboarding" component={Onboarding} />
              <Route path="/profile" component={Profile} />
              <Route path="/applications" component={Applications} />
              <Route path="/jobs" component={Jobs} />
              <Route path="/jobs/:id" component={ViewJob} />
              <Route path="/mock-interview" component={MockInterview} />
              <Route path="/mock-interview/session/:sessionId" component={MockInterviewSession} />
              <Route path="/mock-interview/:sessionId" component={MockInterviewSession} />
              <Route path="/virtual-interview-start" component={VirtualInterviewStart} />
              <Route path="/virtual-interview/start" component={VirtualInterviewStart} />
              <Route path="/virtual-interview/new" component={VirtualInterviewStart} />
              <Route path="/virtual-interview-complete/:sessionId" component={VirtualInterviewComplete} />
              <Route path="/virtual-interview/:sessionId/feedback" component={VirtualInterviewFeedback} />
              <Route path="/virtual-interview/:sessionId" component={VirtualInterview} />
              <Route path="/chat-interview/:sessionId" component={ChatInterview} />
              <Route path="/interview-link/:linkId" component={lazy(() => import("./pages/InterviewLink"))} />
              <Route path="/subscription" component={Subscription} />
              <Route path="/career-ai-assistant" component={CareerAIAssistant} />
              <Route path="/referral-marketplace" component={ReferralMarketplace} />
              <Route path="/become-referrer" component={BecomeReferrer} />
              <Route path="/my-bookings" component={MyBookings} />
              <Route path="/bidder-dashboard" component={BidderDashboard} />
              <Route path="/bidder-profile" component={BidderProfile} />
              <Route path="/chat" component={SimpleChatPage} />
              <Route path="/messaging" component={SimpleChatPage} />
              {/* AI Video Interview Practice Route */}
              <Route path="/video-practice" component={VideoPractice} />
              <Route path="/video-practice/feedback/:sessionId" component={VirtualInterviewFeedback} />
            </>
          )}
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/email-verification" component={() => <EmailVerificationPage />} />
          <Route path="/for-recruiters" component={RecruiterFeatures} />
          <Route path="/recruiters" component={RecruiterFeatures} />
          <Route path="/recruiter-features" component={RecruiterFeatures} />
          <Route path="/test/:id" component={TestTaking} />
          {/* Bidder dashboard - show landing page for unauthenticated users */}
          <Route path="/bidder-dashboard" component={BidderLanding} />
          {/* Redirect unauthenticated users trying to access interviews to login with redirect */}
          <Route path="/virtual-interview/:sessionId">
            {(params) => {
              const redirectUrl = encodeURIComponent(`/virtual-interview/${params.sessionId}`);
              window.location.href = `/auth?redirect=${redirectUrl}`;
              return null;
            }}
          </Route>
          <Route path="/mock-interview/:sessionId">
            {(params) => {
              const redirectUrl = encodeURIComponent(`/mock-interview/${params.sessionId}`);
              window.location.href = `/auth?redirect=${redirectUrl}`;
              return null;
            }}
          </Route>
          <Route path="/chat-interview/:sessionId">
            {(params) => {
              const redirectUrl = encodeURIComponent(`/chat-interview/${params.sessionId}`);
              window.location.href = `/auth?redirect=${redirectUrl}`;
              return null;
            }}
          </Route>
          <Route path="/interview-link/:linkId" component={InterviewLink} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;