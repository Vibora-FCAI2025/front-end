import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, MatchResponse } from "../../lib/api";

interface PlayerStats {
  name: string;
  team: number;
  coveredDistance: number; // in meters
  avgVelocity: number; // km/h
  maxVelocity: number; // km/h
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
  avgVelocity: number; // km/h
  maxVelocity: number; // km/h
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

export const MatchAnalytics = (): JSX.Element => {
  const { matchId } = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "ball" | "heatmap">("overview");
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId || !token) return;
      
      try {
        setLoading(true);
        const match = await apiClient.getMatch(matchId, token);
        
        // Transform API response to match our interface
        // For now, using mock data since the backend doesn't return detailed analytics
        const transformedMatchData: MatchData = {
          id: match.id,
          title: match.title || `Match ${matchId}`,
          date: match.created_at,
          duration: "1:45:30", // This would come from the backend
          score: "6-4, 6-2", // This would come from the backend
          result: "win" as const, // This would come from the backend
          players: [
            {
              name: "You",
              team: 1,
              coveredDistance: 2847,
              avgVelocity: 12.3,
              maxVelocity: 28.5,
              totalHits: 156,
              successfulHits: 142,
              hitAccuracy: 91.0,
              hitAngles: {
                forehand: 45,
                backhand: 32,
                volley: 18,
                smash: 5
              },
              heatmapData: []
            },
            {
              name: "Partner",
              team: 1,
              coveredDistance: 2634,
              avgVelocity: 11.8,
              maxVelocity: 26.2,
              totalHits: 134,
              successfulHits: 125,
              hitAccuracy: 93.3,
              hitAngles: {
                forehand: 38,
                backhand: 41,
                volley: 15,
                smash: 6
              },
              heatmapData: []
            },
            {
              name: "Opponent 1",
              team: 2,
              coveredDistance: 3124,
              avgVelocity: 13.7,
              maxVelocity: 31.2,
              totalHits: 178,
              successfulHits: 159,
              hitAccuracy: 89.3,
              hitAngles: {
                forehand: 52,
                backhand: 29,
                volley: 22,
                smash: 7
              },
              heatmapData: []
            },
            {
              name: "Opponent 2",
              team: 2,
              coveredDistance: 2892,
              avgVelocity: 12.9,
              maxVelocity: 29.8,
              totalHits: 145,
              successfulHits: 132,
              hitAccuracy: 91.0,
              hitAngles: {
                forehand: 41,
                backhand: 35,
                volley: 19,
                smash: 4
              },
              heatmapData: []
            }
          ],
          ballStats: {
            coveredDistance: 8942,
            avgVelocity: 35.7,
            maxVelocity: 89.3,
            avgAcceleration: 12.4,
            maxAcceleration: 45.8,
            totalRallies: 89,
            avgRallyLength: 8.3
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
    { time: '0:00', you: 12, partner: 11, opponent1: 14, opponent2: 13 },
    { time: '0:15', you: 13, partner: 12, opponent1: 15, opponent2: 14 },
    { time: '0:30', you: 14, partner: 13, opponent1: 13, opponent2: 12 },
    { time: '0:45', you: 12, partner: 11, opponent1: 16, opponent2: 15 },
    { time: '1:00', you: 15, partner: 14, opponent1: 14, opponent2: 13 },
    { time: '1:15', you: 13, partner: 12, opponent1: 12, opponent2: 11 },
  ];

  const hitTypeData = matchData.players.map(player => ({
    name: player.name,
    forehand: player.hitAngles.forehand,
    backhand: player.hitAngles.backhand,
    volley: player.hitAngles.volley,
    smash: player.hitAngles.smash
  }));

  const ballVelocityData = [
    { time: '0:00', velocity: 32, acceleration: 10 },
    { time: '0:15', velocity: 38, acceleration: 15 },
    { time: '0:30', velocity: 45, acceleration: 20 },
    { time: '0:45', velocity: 52, acceleration: 18 },
    { time: '1:00', velocity: 41, acceleration: 12 },
    { time: '1:15', velocity: 35, acceleration: 8 },
  ];

  const radarData = matchData.players.map(player => ({
    player: player.name,
    Distance: (player.coveredDistance / 3500) * 100,
    Velocity: (player.avgVelocity / 20) * 100,
    Accuracy: player.hitAccuracy,
    Hits: (player.totalHits / 200) * 100,
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
              <span>{matchData.duration}</span>
              <Badge className={matchData.result === "win" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {matchData.result.toUpperCase()} {matchData.score}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
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
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "players", label: "Player Stats", icon: Users },
          { id: "ball", label: "Ball Analytics", icon: Target },
          { id: "heatmap", label: "Court Heatmap", icon: MapPin }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
                      {(matchData.players.reduce((sum, p) => sum + p.coveredDistance, 0) / 1000).toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ball Distance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(matchData.ballStats.coveredDistance / 1000).toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Rallies</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.totalRallies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rally Length</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.avgRallyLength}s</p>
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="you" stroke="#3B82F6" strokeWidth={2} name="You" />
                  <Line type="monotone" dataKey="partner" stroke="#10B981" strokeWidth={2} name="Partner" />
                  <Line type="monotone" dataKey="opponent1" stroke="#F59E0B" strokeWidth={2} name="Opponent 1" />
                  <Line type="monotone" dataKey="opponent2" stroke="#EF4444" strokeWidth={2} name="Opponent 2" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hit Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Hit Types by Player</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hitTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="forehand" stackId="a" fill="#3B82F6" name="Forehand" />
                  <Bar dataKey="backhand" stackId="a" fill="#10B981" name="Backhand" />
                  <Bar dataKey="volley" stackId="a" fill="#F59E0B" name="Volley" />
                  <Bar dataKey="smash" stackId="a" fill="#EF4444" name="Smash" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Player Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Player Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData[0] ? [radarData[0]] : []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="Distance" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "players" && (
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
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{(player.coveredDistance / 1000).toFixed(2)} km</p>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Velocity</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{player.avgVelocity} km/h</p>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Max Velocity</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{player.maxVelocity} km/h</p>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-purple-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Hit Accuracy</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{player.hitAccuracy}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hit Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(player.hitAngles).map(([type, count]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{count} hits</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                      {(matchData.ballStats.coveredDistance / 1000).toFixed(1)} km
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.avgVelocity} km/h</p>
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.maxVelocity} km/h</p>
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchData.ballStats.avgAcceleration} m/s²</p>
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
                  <CartesianGrid strokeDasharray="3 3" />
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
                    name="Velocity (km/h)"
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
    </div>
  );
}; 