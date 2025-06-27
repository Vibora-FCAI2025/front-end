import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Upload, Play, TrendingUp, Clock, Target, Zap, Users, BarChart3, Eye, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const Dashboard = (): JSX.Element => {
  // Mock data for charts
  const analysisData = [
    { month: "Jan", videos: 8, accuracy: 78 },
    { month: "Feb", videos: 12, accuracy: 82 },
    { month: "Mar", videos: 15, accuracy: 85 },
    { month: "Apr", videos: 18, accuracy: 88 },
    { month: "May", videos: 22, accuracy: 90 },
    { month: "Jun", videos: 25, accuracy: 92 },
  ];

  const recentAnalyses = [
    { id: 1, title: "Match Analysis - Carlos vs Ana", date: "2024-01-15", type: "Match", duration: "1:45:30" },
    { id: 2, title: "Training Session Analysis", date: "2024-01-12", type: "Training", duration: "2:15:45" },
    { id: 3, title: "Tournament Final Analysis", date: "2024-01-10", type: "Tournament", duration: "1:30:20" },
  ];

  const recentMatches = [
    {
      id: 1,
      title: "Carlos vs Ana Rodriguez",
      date: "2024-01-15",
      duration: "1:45:30",
      thumbnail: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=300",
      status: "Analyzed",
      type: "Match"
    },
    {
      id: 2,
      title: "Training Session - Team A",
      date: "2024-01-12",
      duration: "2:15:45",
      thumbnail: "https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=300",
      status: "Analyzed",
      type: "Training"
    },
    {
      id: 3,
      title: "Tournament Final",
      date: "2024-01-10",
      duration: "1:30:20",
      thumbnail: "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=300",
      status: "Processing",
      type: "Tournament"
    },
    {
      id: 4,
      title: "Miguel vs David",
      date: "2024-01-08",
      duration: "1:22:15",
      thumbnail: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=300",
      status: "Analyzed",
      type: "Match"
    }
  ];

  const stats = [
    { title: "Videos Analyzed", value: "156", icon: Play, color: "text-blue-600" },
    { title: "Total Analysis Time", value: "284h", icon: Clock, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to Padel Video Analytics</h1>
        <p className="text-blue-100 mb-4">
          Analyze padel matches and training sessions with advanced video analytics. 
          Track performance, identify patterns, and improve game strategies.
        </p>
        <div className="flex space-x-3">
        <Link to="/upload">
            <Button className="bg-white text-blue-600 hover:bg-gray-50">
            <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
          </Link>
          <Link to="/history">
            <Button className="bg-white text-blue-600 hover:bg-gray-50">
              <Play className="mr-2 h-4 w-4" />
              View Analysis History
          </Button>
        </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analysis Trend */}
        <Card className="hover-glow">
          <CardHeader>
            <CardTitle>Analysis Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="videos" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Videos Analyzed"
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Avg Accuracy (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card className="hover-glow">
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMatches.slice(0, 3).map((match) => (
                <Card key={match.id} className="p-3 hover:bg-card-hover transition-colors">
                  <div className="flex items-center space-x-3">
                    <img
                      src={match.thumbnail}
                      alt={match.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{match.title}</p>
                      <p className="text-xs text-muted-foreground">{match.date}</p>
                  </div>
                    <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        match.status === "Analyzed" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    }`}>
                        {match.status}
                    </span>
                      {match.status === "Analyzed" && (
                        <Link to={`/analytics/${match.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Link to="/history">
              <Button variant="outline" className="w-full mt-4">
                View All Matches
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="hover-glow">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/upload">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover-scale">
                <Upload className="h-6 w-6" />
                <span className="text-sm font-medium">Upload Video</span>
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover-scale">
                <Play className="h-6 w-6" />
                <span className="text-sm font-medium">Video History</span>
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover-scale">
                <Users className="h-6 w-6" />
                <span className="text-sm font-medium">View Profile</span>
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover-scale">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tips */}
      <Card className="hover-glow">
        <CardHeader>
          <CardTitle>Analysis Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Target className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium mb-1">For Players</h4>
                <p className="text-sm text-muted-foreground">
                  Upload match footage to track your shot accuracy, movement patterns, and identify areas for improvement.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Zap className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium mb-1">For Coaches</h4>
                <p className="text-sm text-muted-foreground">
                  Analyze training sessions and matches to develop strategic insights and provide data-driven feedback.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium mb-1">For Analysts</h4>
                <p className="text-sm text-muted-foreground">
                  Generate comprehensive reports with advanced metrics and visualizations for professional analysis.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};