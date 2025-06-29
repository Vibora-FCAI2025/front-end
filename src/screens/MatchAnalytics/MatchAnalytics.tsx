import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { VideoPlayerModal } from "../../components/VideoPlayerModal";
import { EmbeddedVideoPlayer } from "../../components/EmbeddedVideoPlayer";
import { 
  ArrowLeft, 
  Play, 
  Download, 
  Users, 
  Target, 
  Zap, 
  MapPin,
  TrendingUp,
  Activity,
  BarChart3
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, MatchResponse } from "../../lib/api";

interface PlayerStats {
  name: string;
  team: number;
  coveredDistance: number; // in meters
  avgVelocity: number; // m/s
  maxVelocity: number; // m/s
  totalHits: number;
  successfulHits: number;
  hitAccuracy: number; // percentage
  hitAngles: {
    forehand: number;
    backhand: number;
    volley: number;
    smash: number;
  };
  heatmapData: Array<{x: number, y: number, intensity: number}>;
}

interface BallStats {
  coveredDistance: number; // in meters
  avgVelocity: number; // m/s
  maxVelocity: number; // m/s
  avgAcceleration: number; // m/s²
  maxAcceleration: number; // m/s²
  totalRallies: number;
  avgRallyLength: number; // seconds
}

interface MatchData {
  id: string;
  title: string;
  date: string;
  duration: string;
  score: string;
  result: "win" | "loss";
  players: PlayerStats[];
  ballStats: BallStats;
}

interface CSVPlayerData {
  totalDistance: number;
  avgVelocity: number;
  maxVelocity: number;
  hitCount: number;
}

interface CSVBallData {
  totalDistance: number;
  avgVelocity: number;
  maxVelocity: number;
  avgAcceleration: number;
  bounceCount: number;
  velocityOverTime: Array<{time: string, velocity: number, acceleration: number}>;
}

export const MatchAnalytics = (): JSX.Element => {
  const { matchId } = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "ball" | "heatmap">("overview");
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [ballVelocityData, setBallVelocityData] = useState([
    { time: '0:00', velocity: 32, acceleration: 10 },
    { time: '0:15', velocity: 38, acceleration: 15 },
    { time: '0:30', velocity: 45, acceleration: 20 },
    { time: '0:45', velocity: 52, acceleration: 18 },
    { time: '1:00', velocity: 41, acceleration: 12 },
    { time: '1:15', velocity: 35, acceleration: 8 },
  ]);
  const [csvBallData, setCsvBallData] = useState<CSVBallData>({ 
    totalDistance: 0, 
    avgVelocity: 0, 
    maxVelocity: 0, 
    avgAcceleration: 0, 
    bounceCount: 0, 
    velocityOverTime: [] 
  });
  const { token } = useAuth();

  // CSV parsing function
  const parseCSVData = async (csvUrl: string): Promise<{players: CSVPlayerData[], ball: CSVBallData}> => {
    try {
      const response = await fetch(csvUrl);
      const csvText = await response.text();
      
      // Parse CSV data
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      // Find column indices for player data
      const playerDistanceColumns = ['player1_distance', 'player2_distance', 'player3_distance', 'player4_distance'];
      const playerVelocityColumns = ['player1_Vnorm', 'player2_Vnorm', 'player3_Vnorm', 'player4_Vnorm'];
      
      const distanceIndices = playerDistanceColumns.map(col => 
        headers.findIndex(header => header.trim().toLowerCase() === col.toLowerCase())
      ).filter(index => index !== -1);
      
      const velocityIndices = playerVelocityColumns.map(col => 
        headers.findIndex(header => header.trim().toLowerCase() === col.toLowerCase())
      ).filter(index => index !== -1);

      // Find player_ball_hit column index
      const ballHitColumnIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'player_ball_hit'
      );

      // Find ball data column indices
      const ballDistanceIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'ball_distance'
      );
      const ballVelocityIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'ball_vnorm'
      );
      const ballAccelerationIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'ball_anorm'
      );
      const ballBounceIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'ball_bounce'
      );

      // Initialize player data arrays
      const playerDistances: number[][] = Array.from({ length: 4 }, () => []);
      const playerVelocities: number[][] = Array.from({ length: 4 }, () => []);
      const playerHitCounts: number[] = [0, 0, 0, 0]; // Count hits for each player

      // Initialize ball data arrays
      const ballDistances: number[] = [];
      const ballVelocities: number[] = [];
      const ballAccelerations: number[] = [];
      const ballBounces: number[] = [];
      const ballVelocityOverTime: Array<{time: string, velocity: number, acceleration: number}> = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        // Extract distance data
        distanceIndices.forEach((colIndex, playerIndex) => {
          if (playerIndex < 4) {
            const distance = parseFloat(values[colIndex]);
            if (!isNaN(distance)) {
              playerDistances[playerIndex].push(distance);
            }
          }
        });
        
        // Extract velocity data
        velocityIndices.forEach((colIndex, playerIndex) => {
          if (playerIndex < 4) {
            const velocity = parseFloat(values[colIndex]);
            if (!isNaN(velocity)) {
              playerVelocities[playerIndex].push(velocity);
            }
          }
        });

        // Count ball hits for each player
        if (ballHitColumnIndex !== -1 && values[ballHitColumnIndex]) {
          const playerHit = parseInt(values[ballHitColumnIndex].trim());
          if (!isNaN(playerHit) && playerHit >= 1 && playerHit <= 4) {
            playerHitCounts[playerHit - 1]++; // Convert 1-based to 0-based index
          }
        }

        // Extract ball data
        if (ballDistanceIndex !== -1 && values[ballDistanceIndex]) {
          const distance = parseFloat(values[ballDistanceIndex]);
          if (!isNaN(distance)) {
            ballDistances.push(distance);
          }
        }

        if (ballVelocityIndex !== -1 && values[ballVelocityIndex]) {
          const velocity = parseFloat(values[ballVelocityIndex]);
          if (!isNaN(velocity)) {
            ballVelocities.push(velocity);
          }
        }

        if (ballAccelerationIndex !== -1 && values[ballAccelerationIndex]) {
          const acceleration = parseFloat(values[ballAccelerationIndex]);
          if (!isNaN(acceleration)) {
            ballAccelerations.push(acceleration);
          }
        }

        if (ballBounceIndex !== -1 && values[ballBounceIndex]) {
          const bounce = parseFloat(values[ballBounceIndex]);
          if (!isNaN(bounce)) {
            ballBounces.push(bounce);
          }
        }

        // Create time series data for ball velocity/acceleration graph (sample every 10th row for performance)
        if (i % 10 === 0 && ballVelocityIndex !== -1 && ballAccelerationIndex !== -1) {
          const velocity = parseFloat(values[ballVelocityIndex]);
          const acceleration = parseFloat(values[ballAccelerationIndex]);
          if (!isNaN(velocity) && !isNaN(acceleration)) {
            const timeInSeconds = Math.floor((i - 1) / 30); // Assuming 30 fps
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            ballVelocityOverTime.push({
              time: timeString,
              velocity: parseFloat(velocity.toFixed(2)),
              acceleration: parseFloat(acceleration.toFixed(2))
            });
          }
        }
      }

      // Calculate statistics for each player
      const playerData: CSVPlayerData[] = [];
      for (let i = 0; i < 4; i++) {
        const distances = playerDistances[i];
        const velocities = playerVelocities[i];
        
        const totalDistance = distances.reduce((sum, d) => sum + d, 0);
        const avgVelocity = velocities.length > 0 ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length : 0;
        const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0;
        
        playerData.push({
          totalDistance,
          avgVelocity,
          maxVelocity,
          hitCount: playerHitCounts[i]
        });
      }

      // Calculate ball statistics
      const ballData: CSVBallData = {
        totalDistance: ballDistances.reduce((sum, d) => sum + d, 0),
        avgVelocity: ballVelocities.length > 0 ? ballVelocities.reduce((sum, v) => sum + v, 0) / ballVelocities.length : 0,
        maxVelocity: ballVelocities.length > 0 ? Math.max(...ballVelocities) : 0,
        avgAcceleration: ballAccelerations.length > 0 ? ballAccelerations.reduce((sum, a) => sum + a, 0) / ballAccelerations.length : 0,
        bounceCount: ballBounces.reduce((sum, b) => sum + b, 0),
        velocityOverTime: ballVelocityOverTime
      };

      return { players: playerData, ball: ballData };
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      return { 
        players: [], 
        ball: { 
          totalDistance: 0, 
          avgVelocity: 0, 
          maxVelocity: 0, 
          avgAcceleration: 0, 
          bounceCount: 0, 
          velocityOverTime: [] 
        } 
      };
    }
  };

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId || !token) return;
      
      try {
        setLoading(true);
        const matchResponse = await apiClient.getMatch(matchId, token);
        setMatch(matchResponse);
        
        // Parse CSV data if available
        let csvPlayerData: CSVPlayerData[] = [];
        let ballData: CSVBallData = { 
          totalDistance: 0, 
          avgVelocity: 0, 
          maxVelocity: 0, 
          avgAcceleration: 0, 
          bounceCount: 0, 
          velocityOverTime: [] 
        };
        if (matchResponse.analysis_data_url) {
          const csvData = await parseCSVData(matchResponse.analysis_data_url);
          csvPlayerData = csvData.players;
          ballData = csvData.ball;
          
          // Set ball data state
          setCsvBallData(ballData);
          
          // Set ball velocity data for chart
          if (ballData.velocityOverTime.length > 0) {
            setBallVelocityData(ballData.velocityOverTime);
          }
        }
        
        // Transform API response to match our interface
        const matchDate = new Date(matchResponse.date);
        
        // Create player data using CSV data if available, otherwise use mock data
        const playersData: PlayerStats[] = [];
        const playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];
        
        for (let i = 0; i < 4; i++) {
          const csvData = csvPlayerData[i];
          const hasRealData = csvData && (csvData.totalDistance > 0 || csvData.avgVelocity > 0);
          
          const totalHits = hasRealData ? csvData.hitCount : (120 + Math.floor(Math.random() * 80));
          const successfulHits = Math.floor(totalHits * (0.8 + Math.random() * 0.15)); // 80-95% success rate
          
          playersData.push({
            name: playerNames[i],
            team: i < 2 ? 1 : 2, // First 2 players are team 1, last 2 are team 2
            coveredDistance: hasRealData ? csvData.totalDistance : (2500 + Math.random() * 1000), // fallback mock data
            avgVelocity: hasRealData ? csvData.avgVelocity : (10 + Math.random() * 5), // fallback mock data
            maxVelocity: hasRealData ? csvData.maxVelocity : (25 + Math.random() * 10), // fallback mock data
            totalHits: totalHits,
            successfulHits: successfulHits,
            hitAccuracy: totalHits > 0 ? (successfulHits / totalHits) * 100 : (85 + Math.random() * 10), // Calculate accuracy from hits
            hitAngles: {
              forehand: 30 + Math.floor(Math.random() * 25),
              backhand: 25 + Math.floor(Math.random() * 20),
              volley: 10 + Math.floor(Math.random() * 15),
              smash: 3 + Math.floor(Math.random() * 8)
            },
            heatmapData: []
          });
        }
        
        const transformedMatchData: MatchData = {
          id: matchResponse.id,
          title: matchResponse.title || matchDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          date: matchResponse.date,
          duration: "1:45:30", // This would come from the backend
          score: "6-4, 6-2", // This would come from the backend
          result: "win" as const,
          players: playersData,
          ballStats: {
            coveredDistance: ballData.totalDistance || 8942,
            avgVelocity: ballData.avgVelocity || 35.7,
            maxVelocity: ballData.maxVelocity || 89.3,
            avgAcceleration: ballData.avgAcceleration || 12.4,
            maxAcceleration: 45.8, // Not calculated from CSV
            totalRallies: 89, // Not calculated from CSV
            avgRallyLength: 8.3 // Not calculated from CSV
          }
        };
        
        setMatchData(transformedMatchData);
      } catch (err) {
        setError("Failed to load match data");
        console.error("Error fetching match data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId, token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Match not found"}</p>
            <Link to="/history">
              <Button>Back to History</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Chart data
  const velocityOverTime = [
    { 
      time: '0:00', 
      [matchData.players[0].name]: parseFloat((matchData.players[0].avgVelocity * 0.9).toFixed(2)), 
      [matchData.players[1].name]: parseFloat((matchData.players[1].avgVelocity * 0.8).toFixed(2)), 
      [matchData.players[2].name]: parseFloat((matchData.players[2].avgVelocity * 1.1).toFixed(2)), 
      [matchData.players[3].name]: parseFloat((matchData.players[3].avgVelocity * 1.0).toFixed(2)) 
    },
    { 
      time: '0:15', 
      [matchData.players[0].name]: parseFloat((matchData.players[0].avgVelocity * 1.1).toFixed(2)), 
      [matchData.players[1].name]: parseFloat((matchData.players[1].avgVelocity * 1.0).toFixed(2)), 
      [matchData.players[2].name]: parseFloat((matchData.players[2].avgVelocity * 1.2).toFixed(2)), 
      [matchData.players[3].name]: parseFloat((matchData.players[3].avgVelocity * 1.1).toFixed(2)) 
    },
    { 
      time: '0:30', 
      [matchData.players[0].name]: parseFloat((matchData.players[0].avgVelocity * 1.2).toFixed(2)), 
      [matchData.players[1].name]: parseFloat((matchData.players[1].avgVelocity * 1.1).toFixed(2)), 
      [matchData.players[2].name]: parseFloat((matchData.players[2].avgVelocity * 0.9).toFixed(2)), 
      [matchData.players[3].name]: parseFloat((matchData.players[3].avgVelocity * 0.8).toFixed(2)) 
    },
    { 
      time: '0:45', 
      [matchData.players[0].name]: parseFloat((matchData.players[0].avgVelocity * 0.8).toFixed(2)), 
      [matchData.players[1].name]: parseFloat((matchData.players[1].avgVelocity * 0.9).toFixed(2)), 
      [matchData.players[2].name]: parseFloat((matchData.players[2].avgVelocity * 1.3).toFixed(2)), 
      [matchData.players[3].name]: parseFloat((matchData.players[3].avgVelocity * 1.2).toFixed(2)) 
    },
    { 
      time: '1:00', 
      [matchData.players[0].name]: parseFloat((matchData.players[0].avgVelocity * 1.3).toFixed(2)), 
      [matchData.players[1].name]: parseFloat((matchData.players[1].avgVelocity * 1.2).toFixed(2)), 
      [matchData.players[2].name]: parseFloat((matchData.players[2].avgVelocity * 1.0).toFixed(2)), 
      [matchData.players[3].name]: parseFloat((matchData.players[3].avgVelocity * 0.9).toFixed(2)) 
    },
    { 
      time: '1:15', 
      [matchData.players[0].name]: parseFloat((matchData.players[0].avgVelocity * 1.0).toFixed(2)), 
      [matchData.players[1].name]: parseFloat((matchData.players[1].avgVelocity * 0.9).toFixed(2)), 
      [matchData.players[2].name]: parseFloat((matchData.players[2].avgVelocity * 0.8).toFixed(2)), 
      [matchData.players[3].name]: parseFloat((matchData.players[3].avgVelocity * 0.7).toFixed(2)) 
    },
  ];

  const playerHitsData = matchData.players.map(player => ({
    name: player.name,
    hits: player.totalHits
  }));



  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/history">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <span>{new Date(matchData.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsVideoModalOpen(true)}
            disabled={!match?.video_url}
          >
            <Play className="h-4 w-4 mr-2" />
            Watch Replay
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {([
          { id: "overview" as const, label: "Overview", icon: BarChart3 },
          { id: "players" as const, label: "Player Stats", icon: Users },
          { id: "ball" as const, label: "Ball Analytics", icon: Target },
          { id: "heatmap" as const, label: "Court Heatmap", icon: MapPin }
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Annotated Video Player */}
          {match?.annotated_video_url && (
            <Card>
              <CardHeader>
                <CardTitle>Annotated Match Replay</CardTitle>
              </CardHeader>
              <CardContent>
                              <div className="flex justify-center">
                <div className="aspect-video w-full max-w-4xl">
                    <EmbeddedVideoPlayer
                      videoUrl={match.annotated_video_url}
                      title="Annotated Match Replay"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Match Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Distance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(matchData.players.reduce((sum, p) => sum + p.coveredDistance, 0)).toFixed(2)} m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ball Distance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(matchData.ballStats.coveredDistance).toFixed(2)} m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Rallies</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.totalRallies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Ball Hits</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.players.reduce((sum, player) => sum + player.totalHits, 0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Velocity Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Player Velocity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={velocityOverTime}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey={matchData.players[0].name} stroke="#3B82F6" strokeWidth={2} name={matchData.players[0].name} />
                  <Line type="monotone" dataKey={matchData.players[1].name} stroke="#10B981" strokeWidth={2} name={matchData.players[1].name} />
                  <Line type="monotone" dataKey={matchData.players[2].name} stroke="#F59E0B" strokeWidth={2} name={matchData.players[2].name} />
                  <Line type="monotone" dataKey={matchData.players[3].name} stroke="#EF4444" strokeWidth={2} name={matchData.players[3].name} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Player Hits Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Player Hits</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={playerHitsData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hits" fill="#3B82F6" name="Total Hits" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {activeTab === "players" && (
        <div className="space-y-6">
          {/* Aggregated Player Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Distance Covered</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(matchData.players.reduce((sum, player) => sum + player.coveredDistance, 0)).toFixed(2)} m
                    </p>
                    <p className="text-xs text-gray-500">All players combined</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Zap className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Velocity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(matchData.players.reduce((sum, player) => sum + player.avgVelocity, 0) / matchData.players.length).toFixed(2)} m/s
                    </p>
                    <p className="text-xs text-gray-500">Across all players</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Maximum Velocity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.max(...matchData.players.map(player => player.maxVelocity)).toFixed(2)} m/s
                    </p>
                    <p className="text-xs text-gray-500">Highest recorded speed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Velocity Over Time Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Player Velocity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={velocityOverTime}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey={matchData.players[0].name} stroke="#3B82F6" strokeWidth={2} name={matchData.players[0].name} />
                  <Line type="monotone" dataKey={matchData.players[1].name} stroke="#10B981" strokeWidth={2} name={matchData.players[1].name} />
                  <Line type="monotone" dataKey={matchData.players[2].name} stroke="#F59E0B" strokeWidth={2} name={matchData.players[2].name} />
                  <Line type="monotone" dataKey={matchData.players[3].name} stroke="#EF4444" strokeWidth={2} name={matchData.players[3].name} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Individual Player Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Individual Player Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matchData.players.map((player, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{player.name}</span>
                  <Badge variant="outline">Team {player.team}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Distance Covered</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{player.coveredDistance.toFixed(2)} m</p>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Velocity</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{player.avgVelocity.toFixed(2)} m/s</p>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Max Velocity</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{player.maxVelocity.toFixed(2)} m/s</p>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-purple-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Hits</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{player.totalHits}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "ball" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Distance Covered</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(matchData.ballStats.coveredDistance).toFixed(2)} m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Zap className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Velocity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.avgVelocity.toFixed(2)} m/s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Max Velocity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.maxVelocity.toFixed(2)} m/s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Acceleration</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.avgAcceleration.toFixed(2)} m/s²</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ball Bounce Count */}
          <div className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ball Bounce Count</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{csvBallData.bounceCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ball Velocity and Acceleration Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Ball Velocity & Acceleration Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={ballVelocityData}>
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="velocity" orientation="left" />
                  <YAxis yAxisId="acceleration" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="velocity"
                    type="monotone" 
                    dataKey="velocity" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Velocity (m/s)"
                  />
                  <Line 
                    yAxisId="acceleration"
                    type="monotone" 
                    dataKey="acceleration" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Acceleration (m/s²)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "heatmap" && (
        <Card>
          <CardHeader>
            <CardTitle>Court Heatmap</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Player movement patterns and ball trajectory hotspots
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-96 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">Interactive Heatmap</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visualization of player positions and ball trajectory
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={match?.video_url || ''}
        title={matchData?.title || 'Match Replay'}
      />


    </div>
  );
}; 