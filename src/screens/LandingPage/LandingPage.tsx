import React from 'react';
import { Link } from 'react-router-dom';
import { Play, BarChart3, Target, TrendingUp, Users, Award, ChevronRight, Upload, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/image.png" alt="Vibora" className="h-12 w-auto" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="#stats" className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors">Statistics</a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</a>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link to="/login">
                <Button variant="ghost">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button>
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              Revolutionize Your
              <span className="text-primary"> Padel Game</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Advanced AI-powered analytics to track, analyze, and improve your padel performance with real-time insights and data-driven coaching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                  Start Analyzing
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Powerful Analytics Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to elevate your padel game</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover-glow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Automated Tracking</h3>
                <p className="text-muted-foreground">AI-powered player and ball tracking with precision analysis of every movement and shot.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-glow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Data-Driven Insights</h3>
                <p className="text-muted-foreground">Comprehensive statistics, heat maps, and performance metrics to understand your game.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-glow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Performance Enhancement</h3>
                <p className="text-muted-foreground">Actionable recommendations and progress tracking to continuously improve your skills.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Egypt's Padel Revolution</h2>
            <p className="text-xl text-muted-foreground">Leading the growth of padel analytics in the region</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover-glow">
              <CardContent className="p-6">
                <div className="text-5xl font-bold text-primary mb-2">1,500+</div>
                <div className="text-xl text-foreground font-semibold mb-2">Active Courts</div>
                <div className="text-muted-foreground">Across Egypt and growing</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-glow">
              <CardContent className="p-6">
                <div className="text-5xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-xl text-foreground font-semibold mb-2">Matches Analyzed</div>
                <div className="text-muted-foreground">Real performance data</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-glow">
              <CardContent className="p-6">
                <div className="text-5xl font-bold text-primary mb-2">500+</div>
                <div className="text-xl text-foreground font-semibold mb-2">Active Players</div>
                <div className="text-muted-foreground">Improving their game</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">What Players & Coaches Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover-glow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <div className="font-semibold text-foreground">Ahmed Hassan</div>
                    <div className="text-muted-foreground">Professional Coach</div>
                  </div>
                </div>
                <p className="text-muted-foreground">"VIBORA has transformed how I coach my players. The detailed analytics help identify weaknesses and track improvement over time."</p>
              </CardContent>
            </Card>
            <Card className="hover-glow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Award className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <div className="font-semibold text-foreground">Sara Mohamed</div>
                    <div className="text-muted-foreground">Competitive Player</div>
                  </div>
                </div>
                <p className="text-muted-foreground">"The heat maps and movement analysis revealed patterns I never noticed. My game has improved significantly since using VIBORA."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="hover-glow">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Elevate Your Game?</h2>
              <p className="text-xl text-muted-foreground mb-8">Join thousands of players and coaches already using VIBORA</p>
              <Link to="/signup">
                <Button size="lg" className="px-12 py-4 text-xl font-semibold hover-scale">
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/image.png" alt="Vibora" className="h-12 w-auto mb-4" />
              <p className="text-muted-foreground">Advanced padel analytics for players and coaches.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 VIBORA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}; 