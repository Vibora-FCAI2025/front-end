import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, HelpCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

interface ErrorPageProps {
  errorCode?: string;
  errorMessage?: string;
  showBackButton?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ 
  errorCode = "404", 
  errorMessage = "Page Not Found",
  showBackButton = true 
}) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getErrorDescription = () => {
    switch (errorCode) {
      case "404":
        return "The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.";
      case "500":
        return "Something went wrong on our end. Our team has been notified and is working to fix this issue.";
      case "403":
        return "You don't have permission to access this page. Please contact support if you believe this is an error.";
      default:
        return "An unexpected error occurred. Please try again or contact support if the problem persists.";
    }
  };

  const popularPages = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Upload Video", path: "/upload", icon: RefreshCw },
    { name: "Match History", path: "/history", icon: Search },
    { name: "Profile", path: "/profile", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Display Card */}
        <Card className="hover-glow">
          <CardContent className="p-12">
            {/* Error Code Display */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-bold text-primary mb-4">
                {errorCode}
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {errorMessage}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {getErrorDescription()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
              
              {showBackButton && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={handleGoBack}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Go Back
                </Button>
              )}
              
              <Button 
                size="lg"
                variant="outline"
                onClick={handleRefresh}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Pages */}
        <Card className="hover-glow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Popular Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularPages.map((page) => {
                const IconComponent = page.icon;
                return (
                  <Link
                    key={page.path}
                    to={page.path}
                    className="flex flex-col items-center p-4 rounded-lg bg-muted hover:bg-muted-hover transition-colors group"
                  >
                    <IconComponent className="h-8 w-8 text-muted-foreground group-hover:text-foreground mb-2 transition-colors" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {page.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="hover-glow">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-3">
              Can't find what you're looking for?
            </h4>
            <p className="text-muted-foreground mb-4">
              Try searching for specific features or contact our support team for assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/help">
                <Button variant="link" className="text-primary hover:text-primary-hover">
                  Visit Help Center
                </Button>
              </Link>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <Link to="/contact">
                <Button variant="link" className="text-primary hover:text-primary-hover">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Error ID: {Math.random().toString(36).substring(2, 15)}</p>
          <p>Time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}; 