import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Crown,
  Star,
  Zap,
  Target,
  BarChart3,
  Shield,
  Users,
  FileText,
  Search,
  MessageCircle,
  Eye,
  Download,
  TrendingUp,
  Sparkles,
  Clock,
  Infinity,
  Bell
} from "lucide-react";

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  freeLimit: string | number;
  premiumLimit: string | number;
  icon: any;
  category: 'job_seeker' | 'recruiter' | 'both';
}

// All icons are now imported above, so they can be used safely
const PREMIUM_FEATURES: PremiumFeature[] = [
  // Job Seeker Features
  {
    id: 'resume_uploads',
    name: 'Resume Uploads',
    description: 'Upload and manage multiple resume versions',
    freeLimit: 2,
    premiumLimit: 'Unlimited',
    icon: FileText,
    category: 'job_seeker'
  },
  {
    id: 'job_applications',
    name: 'Job Applications',
    description: 'Apply to jobs through the platform',
    freeLimit: 50,
    premiumLimit: 'Unlimited',
    icon: Target,
    category: 'job_seeker'
  },
  {
    id: 'ai_analysis',
    name: 'AI Resume Analysis',
    description: 'Advanced AI-powered resume optimization',
    freeLimit: '3/day',
    premiumLimit: 'Unlimited',
    icon: Sparkles,
    category: 'job_seeker'
  },
  {
    id: 'job_alerts',
    name: 'Job Alerts',
    description: 'Smart job recommendations and alerts',
    freeLimit: '5/day',
    premiumLimit: 'Unlimited',
    icon: Bell,
    category: 'job_seeker'
  },
  {
    id: 'profile_visibility',
    name: 'Profile Visibility',
    description: 'Enhanced profile visibility to recruiters',
    freeLimit: 'Basic',
    premiumLimit: 'Priority',
    icon: Eye,
    category: 'job_seeker'
  },
  {
    id: 'application_tracking',
    name: 'Application Tracking',
    description: 'Advanced application analytics and insights',
    freeLimit: 'Basic',
    premiumLimit: 'Advanced',
    icon: BarChart3,
    category: 'job_seeker'
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: '24/7 premium customer support',
    freeLimit: 'Email only',
    premiumLimit: 'Chat + Email',
    icon: MessageCircle,
    category: 'job_seeker'
  },

  // Recruiter Features
  {
    id: 'job_postings',
    name: 'Job Postings',
    description: 'Post and manage job listings',
    freeLimit: 2,
    premiumLimit: 'Unlimited',
    icon: Target,
    category: 'recruiter'
  },
  {
    id: 'candidate_search',
    name: 'Candidate Search',
    description: 'Advanced candidate search and filtering',
    freeLimit: '10/day',
    premiumLimit: 'Unlimited',
    icon: Search,
    category: 'recruiter'
  },
  {
    id: 'premium_targeting',
    name: 'Premium Candidate Targeting',
    description: 'AI-powered candidate matching and targeting',
    freeLimit: 'Not Available',
    premiumLimit: 'Available',
    icon: Zap,
    category: 'recruiter'
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Detailed recruitment analytics and insights',
    freeLimit: 'Not Available',
    premiumLimit: 'Available',
    icon: BarChart3,
    category: 'recruiter'
  },
  {
    id: 'custom_tests',
    name: 'Custom Assessment Tests',
    description: 'Create and manage custom skill tests',
    freeLimit: 0,
    premiumLimit: 50,
    icon: FileText,
    category: 'recruiter'
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Integration with your existing ATS systems',
    freeLimit: 'Not Available',
    premiumLimit: 'Available',
    icon: Shield,
    category: 'recruiter'
  },
  {
    id: 'bulk_messaging',
    name: 'Bulk Messaging',
    description: 'Send messages to multiple candidates',
    freeLimit: '5/day',
    premiumLimit: 'Unlimited',
    icon: MessageCircle,
    category: 'recruiter'
  },
  {
    id: 'resume_downloads',
    name: 'Resume Downloads',
    description: 'Download candidate resumes',
    freeLimit: '10/month',
    premiumLimit: 'Unlimited',
    icon: Download,
    category: 'recruiter'
  }
];

interface PremiumFeaturesListProps {
  userType: 'job_seeker' | 'recruiter';
  currentPlan: 'free' | 'premium' | 'enterprise';
  className?: string;
}

export function PremiumFeaturesList({ userType, currentPlan, className }: PremiumFeaturesListProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'job_seeker' | 'recruiter'>('all');

  const filteredFeatures = PREMIUM_FEATURES.filter(feature => {
    if (selectedCategory === 'all') return feature.category === userType || feature.category === 'both';
    return feature.category === selectedCategory || feature.category === 'both';
  });

  const isPremium = currentPlan === 'premium' || currentPlan === 'enterprise';

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Premium Features
          </h2>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {isPremium
            ? "You're enjoying all premium benefits! Here's what you have access to:"
            : "Upgrade to premium to unlock powerful features and accelerate your career growth:"
          }
        </p>
      </div>

      <div className="grid gap-4">
        {filteredFeatures.map((feature) => {
          const Icon = feature.icon;
          const hasAccess = isPremium || (typeof feature.freeLimit === 'number' && feature.freeLimit > 0) || feature.freeLimit === 'Basic';

          return (
            <Card key={feature.id} className={`border transition-all duration-200 ${
              hasAccess
                ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      hasAccess
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Free:</span>
                          <span className="ml-1 font-medium">
                            {typeof feature.freeLimit === 'boolean'
                              ? (feature.freeLimit ? 'Yes' : 'No')
                              : feature.freeLimit
                            }
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Premium:</span>
                          <span className="ml-1 font-medium text-yellow-600 dark:text-yellow-400">
                            {typeof feature.premiumLimit === 'boolean'
                              ? (feature.premiumLimit ? 'Yes' : 'No')
                              : feature.premiumLimit
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAccess ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="w-3 h-3 mr-1" />
                        {isPremium ? 'Premium' : 'Available'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium Only
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isPremium && (
        <Card className="mt-6 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Ready to unlock premium features?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Join thousands of professionals who have accelerated their careers with our premium features.
            </p>
            <Button
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              onClick={() => window.location.href = `/${userType}/premium`}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}