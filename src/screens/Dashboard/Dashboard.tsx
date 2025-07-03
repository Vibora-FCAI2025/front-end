import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Upload, Play, Eye, TrendingUp, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

import { EmbeddedVideoPlayer } from "../../components/EmbeddedVideoPlayer";
import { VideoPlayerModal } from "../../components/VideoPlayerModal";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, MatchResponse, PaginatedMatchResponse } from "../../lib/api";
import { PlayerVelocityChart, PlayerHitsBarChart } from '../../components/MatchAnalysisCharts';

type VelocityOverTimeEntry = { time: string; [player: string]: number | string };
type ChartData = {
  velocityOverTime: VelocityOverTimeEntry[];
  playerHitsData: { name: string; hits: number }[];
  playerNames: string[];
};

async function parseCSVData(csvUrl: string): Promise<ChartData> {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const playerVelocityColumns = ['player1_Vnorm', 'player2_Vnorm', 'player3_Vnorm', 'player4_Vnorm'];
    const velocityIndices = playerVelocityColumns.map(col => headers.findIndex(header => header.trim().toLowerCase() === col.toLowerCase())).filter(index => index !== -1);
    const playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
    // Build velocityOverTime for chart
    const velocityOverTime: VelocityOverTimeEntry[] = [];
    for (let i = 1; i < lines.length; i += 10) { // sample every 10th row for performance
      const values = lines[i].split(',');
      const timeInSeconds = Math.floor((i - 1) / 30); // Assuming 30 fps
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      const entry: VelocityOverTimeEntry = { time: timeString };
      velocityIndices.forEach((colIndex, idx) => {
        entry[playerNames[idx]] = parseFloat(values[colIndex]) || 0;
      });
      velocityOverTime.push(entry);
    }
    // Player hits
    const ballHitColumnIndex = headers.findIndex(header => header.trim().toLowerCase() === 'player_ball_hit');
    const playerHitCounts = [0, 0, 0, 0];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (ballHitColumnIndex !== -1 && values[ballHitColumnIndex]) {
        const playerHit = parseInt(values[ballHitColumnIndex].trim());
        if (!isNaN(playerHit) && playerHit >= 1 && playerHit <= 4) {
          playerHitCounts[playerHit - 1]++;
        }
      }
    }
    const playerHitsData = playerNames.map((name, idx) => ({ name, hits: playerHitCounts[idx] }));
    return { velocityOverTime, playerHitsData, playerNames };
  } catch (error) {
    return { velocityOverTime: [], playerHitsData: [], playerNames: [] };
  }
}

export const Dashboard = (): JSX.Element => {
  const { token } = useAuth();
  const [recentMatches, setRecentMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(null);
  const [chartData, setChartData] = React.useState<ChartData>({ velocityOverTime: [], playerHitsData: [], playerNames: [] });
  const [csvLoading, setCsvLoading] = React.useState(false);
  const lastFetchedCsvUrl = React.useRef<string | null>(null);

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

  // Function to handle opening video replay
  const handleReplayClick = (matchId: string) => {
    const match = recentMatches.find(m => m.id === matchId);
    if (match && match.video_url) {
      setSelectedMatch(match);
      setIsVideoModalOpen(true);
    }
  };

  // Convert API matches to the format expected by the component
  const recentMatchesFormatted = recentMatches.map((match) => ({
    id: match.id,
    title: match.title || new Date(match.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    date: match.date,
    duration: "N/A", // Duration not available from API
    thumbnail: match.match_screenshot_url || "",
    status: match.status === "finished" ? "Processed" : 
            match.status === "processing" ? "Processing" : 
            match.status === "queued" ? "Queued" :
            match.status === "pending" ? "Pending" : "Failed",
    type: "Match"
  }));

  // Find the latest processed match (MatchResponse, not formatted)
  const latestProcessedMatchCsv = recentMatches.find(m => m.status === "finished");

  React.useEffect(() => {
    async function fetchCSVForLatest() {
      if (!latestProcessedMatchCsv) return;
      const csvUrl = latestProcessedMatchCsv.analysis_data_url;
      if (csvUrl && csvUrl !== lastFetchedCsvUrl.current) {
        setCsvLoading(true);
        const data = await parseCSVData(csvUrl);
        setChartData(data);
        setCsvLoading(false);
        lastFetchedCsvUrl.current = csvUrl;
      }
    }
    fetchCSVForLatest();
  }, [latestProcessedMatchCsv?.id, latestProcessedMatchCsv?.analysis_data_url]);

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
          ) : latestProcessedMatchCsv ? (
            <div className="space-y-6">
              {/* Match Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{latestProcessedMatchCsv.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(latestProcessedMatchCsv.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <Link to={`/analytics/${latestProcessedMatchCsv.id}`}>
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
                    {recentMatches.find(m => m.id === latestProcessedMatchCsv.id)?.annotated_video_url ? (
                      <EmbeddedVideoPlayer
                        videoUrl={recentMatches.find(m => m.id === latestProcessedMatchCsv.id)?.annotated_video_url || ''}
                        title="Annotated Match Replay"
                        className="w-full h-full rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <div className="text-center">
                          <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Annotated video will appear here</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">After match analysis is complete</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Velocity Chart */}
                <div>
                  <h4 className="font-medium mb-3">Player Velocity Over Time</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time player movement analysis
                  </p>
                  {csvLoading ? (
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading velocity data...</p>
                      </div>
                    </div>
                  ) : chartData.velocityOverTime.length > 0 ? (
                    <PlayerVelocityChart
                      data={chartData.velocityOverTime}
                      playerNames={chartData.playerNames}
                      colors={["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Velocity data will appear here</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">After match analysis is complete</p>
                      </div>
                    </div>
                  )}
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
                    {match.thumbnail ? (
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
                    ) : null}
                    <div 
                      className={`thumbnail-fallback w-20 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded ${!match.thumbnail ? 'block' : 'hidden'}`}
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReplayClick(match.id)}
                          disabled={!recentMatches.find(m => m.id === match.id)?.video_url}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Replay
                        </Button>
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

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={selectedMatch?.video_url || ''}
        title={selectedMatch?.title || 'Match Replay'}
      />

    </div>
  );
};