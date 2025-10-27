import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Video, MessageCircle, Brain, Clock, Target, Sparkles, Award, Zap } from "lucide-react";
import { Link } from "wouter";

export default function AiInterviewPlatform() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>AI Interview Platform - Automated Virtual Interviews | AutoJobr</title>
        <meta name="description" content="AI-powered interview platform that conducts video and chat interviews 24/7. Screen candidates automatically, analyze responses with AI, and reduce time-to-hire by 80%. Free trial available." />
        <meta name="keywords" content="AI interview platform, virtual interview software, automated interviews, AI recruiter, candidate screening automation, video interview AI" />
        
        {/* Open Graph */}
        <meta property="og:title" content="AI Interview Platform - Automated Screening | AutoJobr" />
        <meta property="og:description" content="Let AI conduct your initial interviews. Screen 100 candidates in the time it takes to interview 1." />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Interview Platform | AutoJobr" />
        <meta name="twitter:description" content="Automate candidate screening with AI-powered virtual interviews" />
        
        <link rel="canonical" href="https://autojobr.com/ai-interview-platform" />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16" data-testid="hero-section">
          <div className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            🤖 AI conducts 10,000+ interviews monthly
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI-Powered Interview Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Let AI conduct your initial interviews 24/7. Screen <span className="font-bold text-purple-600">100 candidates</span> in the time it takes to interview 1.
            Reduce time-to-hire by 80% while improving quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg" data-testid="button-try-ai-interviews">
                <Sparkles className="w-5 h-5 mr-2" />
                Try AI Interviews Free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" data-testid="button-watch-demo">
                <Video className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ✅ No setup required • ✅ Works in any language • ✅ Cancel anytime
          </p>
        </div>

        {/* Interview Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Interview Style</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-200 dark:border-blue-700" data-testid="card-video-interviews">
              <CardHeader>
                <Video className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle className="text-2xl">AI Video Interviews</CardTitle>
                <CardDescription>Face-to-face with AI interviewer</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>AI asks questions via video & voice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Candidates respond on camera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Emotion & confidence analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Anti-cheating detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Automatic transcription & scoring</span>
                  </li>
                </ul>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    💡 Best for: Sales, Customer Success, Leadership roles
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 dark:border-purple-700" data-testid="card-chat-interviews">
              <CardHeader>
                <MessageCircle className="w-12 h-12 text-purple-500 mb-4" />
                <CardTitle className="text-2xl">AI Chat Interviews</CardTitle>
                <CardDescription>Text-based conversational screening</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Natural conversation flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Adaptive follow-up questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Technical skill assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Code snippet evaluation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Instant scoring & ranking</span>
                  </li>
                </ul>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    💡 Best for: Technical, Remote, High-volume hiring
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How AI Interviews Work</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card data-testid="step-1">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300 mb-4">
                  1
                </div>
                <CardTitle>Setup Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose from 50+ industry templates or create custom questions. AI adapts to role requirements.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="step-2">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-purple-300 mb-4">
                  2
                </div>
                <CardTitle>Invite Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Send interview links automatically. Candidates take interviews on their schedule, 24/7.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="step-3">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center text-2xl font-bold text-pink-600 dark:text-pink-300 mb-4">
                  3
                </div>
                <CardTitle>AI Conducts Interview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  AI asks questions, listens to responses, and follows up intelligently. No human time required.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="step-4">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-2xl font-bold text-green-600 dark:text-green-300 mb-4">
                  4
                </div>
                <CardTitle>Get Scored Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  AI scores, ranks, and highlights top candidates. Review only the best fits for final rounds.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Advanced AI Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="feature-analysis">
              <CardHeader>
                <Brain className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle>Deep Answer Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  AI evaluates communication skills, technical knowledge, cultural fit, and problem-solving ability from responses.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Sentiment analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Confidence scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Red flag detection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="feature-templates">
              <CardHeader>
                <Target className="w-12 h-12 text-purple-500 mb-4" />
                <CardTitle>Industry Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Pre-built interview templates for 50+ roles and industries. Customize to your needs in minutes.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Software Engineering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Sales & Marketing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Healthcare & Finance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="feature-proctoring">
              <CardHeader>
                <Award className="w-12 h-12 text-pink-500 mb-4" />
                <CardTitle>Anti-Cheating System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Advanced proctoring detects multiple people, tab switching, and AI-generated responses to ensure authenticity.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Face detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Screen monitoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>AI-written detection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ROI Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Measurable ROI for Your Hiring Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
              <CardHeader>
                <Clock className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>80% Time Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Eliminate 15+ hours/week of screening calls. Let AI handle first-round interviews automatically.
                </p>
                <div className="text-2xl font-bold text-green-600">15+ hours saved per week</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700">
              <CardHeader>
                <Zap className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>3x Faster Hiring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Screen 100 candidates in the time it takes to interview 1. Fill positions 3x faster.
                </p>
                <div className="text-2xl font-bold text-blue-600">45 days → 15 days</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
              <CardHeader>
                <Target className="w-12 h-12 text-purple-600 mb-4" />
                <CardTitle>Better Quality Hires</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Consistent, unbiased screening. AI never has a bad day or unconscious bias.
                </p>
                <div className="text-2xl font-bold text-purple-600">40% better retention</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Automate Your Interviews?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 500+ companies using AI to screen candidates 10x faster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" data-testid="button-cta-start">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-6 text-lg" data-testid="button-cta-demo">
                <Video className="w-5 h-5 mr-2" />
                See AI in Action
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-6 opacity-75">
            🤖 AI ready in 5 minutes • 🎯 No technical skills required • ✅ Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
