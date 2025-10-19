import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function NotFound() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <LogIn className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Login Required</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Please log in to access this page. Create a free account or sign in to continue.
            </p>

            <div className="mt-6 flex gap-3">
              <Button 
                onClick={() => {
                  const currentPath = window.location.pathname;
                  setLocation(`/auth?redirect=${encodeURIComponent(currentPath)}`);
                }}
                className="flex-1"
                data-testid="button-login"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
              <Button 
                onClick={() => setLocation('/')}
                variant="outline"
                className="flex-1"
                data-testid="button-home"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            The page you're looking for doesn't exist.
          </p>

          <div className="mt-6">
            <Button 
              onClick={() => setLocation('/dashboard')}
              className="w-full"
              data-testid="button-dashboard"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
