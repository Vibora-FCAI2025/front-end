import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Play, Download, Search, Filter, Calendar, User, Upload, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, MatchResponse } from "../../lib/api";

interface MatchVideo {
  id: string;
  title: string;
  opponent: string;
  date: string;
  duration: string;
  thumbnail: string;
  status: "processed" | "processing" | "failed";
  result: "win" | "loss" | "draw";
  score: string;
  analytics: {
    shotSpeed: number;
    accuracy: number;
    rallies: number;
  };
}

export const VideoHistory = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    const fetchMatchHistory = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const matchHistory = await apiClient.getMatchHistory(token);
        
        // Transform API response to match our interface
        const transformedVideos: MatchVideo[] = matchHistory.map((match, index) => ({
          id: match.id,
          title: match.title || `Match ${index + 1}`,
          opponent: "Opponent", // This would come from the backend
          date: match.created_at,
          duration: "1:30:00", // This would come from the backend
          thumbnail: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400",
          status: match.status as "processed" | "processing" | "failed",
          result: "win" as const, // This would come from the backend
          score: "6-4, 6-2", // This would come from the backend
          analytics: {
            shotSpeed: 95,
            accuracy: 87,
            rallies: 142,
          },
        }));
        
        setVideos(transformedVideos);
      } catch (err) {
        setError("Failed to load match history");
        console.error("Error fetching match history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchHistory();
  }, [token]);

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.opponent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || video.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "processing": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "win": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "loss": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "draw": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Video History</h1>
          <p className="text-muted-foreground">
            View and analyze your previously uploaded match videos.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/reports">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by match title or opponent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <option value="all">All Status</option>
                <option value="processed">Processed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover-glow hover-lift">
            <div className="relative">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button size="sm" className="bg-white text-black hover:bg-gray-50">
                  <Play className="h-4 w-4 mr-2" />
                  Watch
                </Button>
              </div>
              <div className="absolute top-2 right-2">
                <Badge className={getStatusColor(video.status)}>
                  {video.status}
                </Badge>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                {video.duration}
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{video.title}</h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  vs {video.opponent}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(video.date).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <Badge className={getResultColor(video.result)}>
                  {video.result.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">
                  {video.score}
                </span>
              </div>

              {video.status === "processed" && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="font-medium">{video.analytics.shotSpeed}</p>
                      <p className="text-muted-foreground">km/h</p>
                    </div>
                    <div>
                      <p className="font-medium">{video.analytics.accuracy}%</p>
                      <p className="text-muted-foreground">Accuracy</p>
                    </div>
                    <div>
                      <p className="font-medium">{video.analytics.rallies}</p>
                      <p className="text-muted-foreground">Rallies</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Link to={`/analytics/${video.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                  View Analytics
                </Button>
                    </Link>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Play className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Upload your first video to get started with analysis."
              }
            </p>
            <Link to="/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};