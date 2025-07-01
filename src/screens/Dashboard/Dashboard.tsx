import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Upload, Play, Eye, FileText, TrendingUp, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { EmbeddedVideoPlayer } from "../../components/EmbeddedVideoPlayer";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, MatchResponse, PaginatedMatchResponse } from "../../lib/api";


export const Dashboard = (): JSX.Element => {
  const { token } = useAuth();
  const [recentMatches, setRecentMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch recent matches from API
  useEffect(() => {
    const fetchRecentMatches = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError("");
        
        // Get first page with 6 items for dashboard
        const response = await apiClient.getMatchHistory(token, 1, 6);
        setRecentMatches(response.matches);
      } catch (err) {
        setError("Failed to load recent matches");
        console.error("Error fetching recent matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMatches();
  }, [token]);

  // Convert API matches to the format expected by the component
  const recentMatchesFormatted = recentMatches.map((match) => ({
    id: match.id,
    title: match.title || new Date(match.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    date: match.date,
    duration: "1:45:30", // Would come from API in real implementation
    thumbnail: match.match_screenshot_url || "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=300",
    status: match.status === "finished" ? "Processed" : 
            match.status === "processing" ? "Processing" : 
            match.status === "queued" ? "Queued" :
            match.status === "pending" ? "Pending" : "Failed",
    type: "Match"
  }));

  // Original mock data as fallback
  const mockRecentMatches = [
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

  // Find the latest processed match
  const latestProcessedMatch = recentMatchesFormatted.find(match => match.status === "Processed");

  // Mock velocity data for the latest match
  const velocityOverTime = latestProcessedMatch ? [
    { time: '0:00', 'Player 1': 12.5, 'Player 2': 11.8, 'Player 3': 13.2, 'Player 4': 12.1 },
    { time: '0:15', 'Player 1': 14.2, 'Player 2': 13.5, 'Player 3': 15.1, 'Player 4': 13.8 },
    { time: '0:30', 'Player 1': 15.8, 'Player 2': 14.9, 'Player 3': 14.2, 'Player 4': 12.7 },
    { time: '0:45', 'Player 1': 13.1, 'Player 2': 12.8, 'Player 3': 16.4, 'Player 4': 15.2 },
    { time: '1:00', 'Player 1': 16.5, 'Player 2': 15.7, 'Player 3': 14.8, 'Player 4': 13.9 },
    { time: '1:15', 'Player 1': 14.9, 'Player 2': 13.6, 'Player 3': 12.5, 'Player 4': 11.8 },
  ] : [];

  return (
    <div className="space-y-6">

      {/* Latest Match Analysis */}
      <Card className="hover-glow">
        <CardHeader>
          <CardTitle>Latest Processed Match</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-sm text-gray-500">Loading latest processed match...</div>
            </div>
          ) : latestProcessedMatch ? (
            <div className="space-y-6">
              {/* Match Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{latestProcessedMatch.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(latestProcessedMatch.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <Link to={`/analytics/${latestProcessedMatch.id}`}>
                  <Button>
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Analysis
                  </Button>
                </Link>
              </div>

              {/* Horizontal Layout for Video and Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Annotated Video Player */}
                <div>
                  <h4 className="font-medium mb-3">Annotated Match Replay</h4>
                  {/* Use annotated video URL if available, otherwise fall back to screenshot */}
                  <div className="w-full h-[300px]">
                    <EmbeddedVideoPlayer
                      videoUrl={recentMatches.find(m => m.id === latestProcessedMatch.id)?.annotated_video_url || latestProcessedMatch.thumbnail}
                      title="Annotated Match Replay"
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                </div>

                {/* Player Velocity Chart */}
                <div>
                  <h4 className="font-medium mb-3">Player Velocity Over Time</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time player movement analysis
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={velocityOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="Player 1" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Player 1"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Player 2" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Player 2"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Player 3" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        name="Player 3"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Player 4" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        name="Player 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-sm text-gray-500">No processed matches found</div>
              <div className="text-xs text-gray-400 mt-2">Upload a match and wait for processing to complete</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Matches List */}
      <Card className="hover-glow">
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
        </CardHeader>
                  <CardContent>
            <div className="space-y-4">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-pulse text-sm text-gray-500">Loading recent matches...</div>
                </div>
              )}
              
              {error && (
                <div className="text-center py-8">
                  <div className="text-sm text-red-500">{error}</div>
                </div>
              )}
              
              {!loading && !error && recentMatchesFormatted.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">No matches found</div>
                </div>
              )}
              
              {!loading && !error && recentMatchesFormatted.slice(0, 4).map((match) => (
              <Card key={match.id} className="p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={match.thumbnail}
                      alt={match.title}
                      className="w-20 h-16 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLDivElement;
                        if (fallback && fallback.classList.contains('thumbnail-fallback')) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <div 
                      className="thumbnail-fallback w-20 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded"
                      style={{ display: 'none' }}
                    >
                      <Play className="h-6 w-6 opacity-50" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 truncate">{match.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(match.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <span className={`inline-flex mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        match.status === "Processed" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    }`}>
                        {match.status}
                    </span>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {match.status === "Processed" ? (
                      <div className="flex space-x-2">
                        <Link to={`/analytics/${match.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Analysis
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Replay
                        </Button>
                        <Link to="/reports">
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-1" />
                            Report
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button size="sm" disabled>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        {match.status}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Link to="/history">
            <Button variant="outline" className="w-full mt-6">
              View All Matches
            </Button>
          </Link>
        </CardContent>
      </Card>




    </div>
  );
};