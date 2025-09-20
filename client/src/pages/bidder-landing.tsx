import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  DollarSign, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";

export default function BidderLanding() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Project Marketplace",
      description: "Browse and bid on exciting projects from companies and entrepreneurs."
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Competitive Bidding", 
      description: "Set your own rates and compete fairly for projects that match your skills."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Client Matching",
      description: "Get matched with clients looking for your specific expertise and skills."
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Rating System",
      description: "Build your reputation with client reviews and showcase your success rate."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Payments",
      description: "Protected milestone-based payments ensure you get paid for your work."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fast Track Projects",
      description: "Access urgent projects with premium rates for quick turnaround."
    }
  ];

  const projectTypes = [
    "Web Development",
    "Mobile Apps", 
    "UI/UX Design",
    "Content Writing",
    "Digital Marketing",
    "Data Analysis",
    "Consulting",
    "Other Services"
  ];

  const benefits = [
    "Set your own hourly rates",
    "Choose projects that interest you", 
    "Work with vetted clients",
    "Get paid on time, every time",
    "Build a professional portfolio",
    "Access to premium project tiers"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <TrendingUp className="h-4 w-4 mr-2" />
            Join 10,000+ Freelancers
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AutoJobr Bidder Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with clients, bid on projects, and grow your freelance business. 
            Join the marketplace where talent meets opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/auth')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">$2M+</div>
              <div className="text-gray-600">Total Earnings Paid</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">5,000+</div>
              <div className="text-gray-600">Projects Completed</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600">Client Satisfaction</div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose AutoJobr?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Project Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Project Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {projectTypes.map((type, index) => (
              <Card key={index} className="text-center hover:bg-blue-50 transition-colors cursor-pointer">
                <CardContent className="py-6">
                  <div className="font-medium text-gray-700">{type}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
              <p className="text-gray-600">Set up your profile, showcase your skills, and set your rates.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Bid</h3>
              <p className="text-gray-600">Find projects that match your expertise and submit competitive bids.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Deliver & Earn</h3>
              <p className="text-gray-600">Complete projects, earn money, and build your reputation.</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Freelancer Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of freelancers already growing their business on AutoJobr
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setLocation('/auth')}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Sign Up Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}