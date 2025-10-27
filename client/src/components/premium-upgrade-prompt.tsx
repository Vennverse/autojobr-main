import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, TrendingUp, Star } from "lucide-react";

interface PremiumUpgradePromptProps {
  feature: string;
  limit: number | string;
  current: number;
  userType: 'job_seeker' | 'recruiter';
  className?: string;
}

export function PremiumUpgradePrompt({ 
  feature, 
  limit, 
  current, 
  userType, 
  className 
}: PremiumUpgradePromptProps) {
  const featureMessages = {
    resumeUploads: {
      title: "Resume Upload Limit Reached",
      description: "You've reached your free plan limit. Upgrade to upload unlimited resumes and showcase your full potential.",
      benefits: ["Unlimited resume uploads", "Advanced ATS optimization", "AI-powered improvements"]
    },
    jobApplications: {
      title: "Application Limit Reached", 
      description: "You've used all your free applications. Upgrade to apply to unlimited jobs and accelerate your job search.",
      benefits: ["Unlimited job applications", "Priority application status", "Advanced matching"]
    },
    jobPostings: {
      title: "Job Posting Limit Reached",
      description: "You've reached your free posting limit. Upgrade to post unlimited jobs and find top talent.",
      benefits: ["Unlimited job postings", "Premium candidate targeting", "Advanced analytics"]
    },
    aiAnalyses: {
      title: "AI Analysis Limit Reached",
      description: "You've used your daily AI analyses. Upgrade for unlimited AI-powered insights.",
      benefits: ["Unlimited AI analysis", "Advanced recommendations", "Real-time optimization"]
    }
  };

  const messageConfig = featureMessages[feature as keyof typeof featureMessages] || {
    title: "Feature Limit Reached",
    description: "Upgrade to premium to unlock unlimited access to this feature.",
    benefits: ["Unlimited access", "Premium features", "Priority support"]
  };

  return (
    <Card className={`border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {messageConfig.title}
              </h3>
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                {current}/{limit}
              </Badge>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {messageConfig.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {messageConfig.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                onClick={() => window.location.href = `/${userType}/premium`}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Join 10K+ professionals
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}