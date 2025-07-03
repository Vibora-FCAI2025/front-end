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
  BarChart3,
  FileText
} from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, MatchResponse } from "../../lib/api";
import { PlayerVelocityChart, PlayerHitsBarChart, BallVelocityAccelerationChart } from '../../components/MatchAnalysisCharts';

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
  positionData?: Array<{x: number, y: number}>; // Position data for heatmap
}

interface CSVBallData {
  totalDistance: number;
  avgVelocity: number;
  maxVelocity: number;
  avgAcceleration: number;
  bounceCount: number;
  velocityOverTime: Array<{time: string, velocity: number, acceleration: number}>;
  positionData: Array<{x: number, y: number}>; // Ball position data for heatmap
  hitPositions: Array<{x: number, y: number}>; // Ball hit locations (when ball_hit == 1)
}

export const MatchAnalytics = (): JSX.Element => {
  const { matchId } = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "ball" | "heatmap">("overview");
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
    velocityOverTime: [], 
    positionData: [],
    hitPositions: []
  });
  const [selectedPlayers, setSelectedPlayers] = useState<boolean[]>([true, false, false, false]); // Player 1 selected by default
  const [selectedHeatmap, setSelectedHeatmap] = useState<"multi-player" | "individual-players" | "ball-movement" | "ball-hits">("multi-player");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const { token } = useAuth();

  // Check if analysis is available based on match status
  const isAnalysisNotAvailable = match ? (
    match.status === 'uploaded' || 
    match.status === 'processing' || 
    match.status === 'pending' ||
    !match.analysis_data_url
  ) : false;

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

      // Find player position column indices for heatmap
      const playerXIndices = ['player1_x', 'player2_x', 'player3_x', 'player4_x'].map(col =>
        headers.findIndex(header => header.trim().toLowerCase() === col.toLowerCase())
      );
      const playerYIndices = ['player1_y', 'player2_y', 'player3_y', 'player4_y'].map(col =>
        headers.findIndex(header => header.trim().toLowerCase() === col.toLowerCase())
      );

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
      const ballXIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'ball_x'
      );
      const ballYIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'ball_y'
      );
      const ballHitIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'ball_hit'
      );

      // Initialize player data arrays
      const playerDistances: number[][] = Array.from({ length: 4 }, () => []);
      const playerVelocities: number[][] = Array.from({ length: 4 }, () => []);
      const playerHitCounts: number[] = [0, 0, 0, 0]; // Count hits for each player
      const allPlayerPositions: Array<Array<{x: number, y: number}>> = [[], [], [], []]; // Position data for all players

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

        // Extract position data for all players for heatmap
        for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
          const xIndex = playerXIndices[playerIndex];
          const yIndex = playerYIndices[playerIndex];
          
          if (xIndex !== -1 && yIndex !== -1 && values[xIndex] && values[yIndex]) {
            const x = parseFloat(values[xIndex]);
            const y = parseFloat(values[yIndex]);
            if (!isNaN(x) && !isNaN(y)) {
              allPlayerPositions[playerIndex].push({ x, y });
            }
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
          hitCount: playerHitCounts[i],
          positionData: allPlayerPositions[i] // Add position data for all players
        });
      }

      // Calculate ball statistics and collect position data
      const ballPositionData: Array<{x: number, y: number}> = [];
      const ballHitPositions: Array<{x: number, y: number}> = [];
      
      // Extract ball position data and ball hit positions
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        if (ballXIndex !== -1 && ballYIndex !== -1 && values[ballXIndex] && values[ballYIndex]) {
          const x = parseFloat(values[ballXIndex]);
          const y = parseFloat(values[ballYIndex]);
          if (!isNaN(x) && !isNaN(y)) {
            ballPositionData.push({ x, y });
            
            // Check if this is a ball hit location
            if (ballHitIndex !== -1 && values[ballHitIndex]) {
              const ballHit = parseFloat(values[ballHitIndex]);
              if (ballHit === 1) {
                ballHitPositions.push({ x, y });
              }
            }
          }
        }
      }

      const ballData: CSVBallData = {
        totalDistance: ballDistances.reduce((sum, d) => sum + d, 0),
        avgVelocity: ballVelocities.length > 0 ? ballVelocities.reduce((sum, v) => sum + v, 0) / ballVelocities.length : 0,
        maxVelocity: ballVelocities.length > 0 ? Math.max(...ballVelocities) : 0,
        avgAcceleration: ballAccelerations.length > 0 ? ballAccelerations.reduce((sum, a) => sum + a, 0) / ballAccelerations.length : 0,
        bounceCount: ballBounces.reduce((sum, b) => sum + b, 0),
        velocityOverTime: ballVelocityOverTime,
        positionData: ballPositionData,
        hitPositions: ballHitPositions
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
          velocityOverTime: [],
          positionData: [],
          hitPositions: []
        } 
      };
    }
  };

  // Window resize handler for responsive heatmaps
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          velocityOverTime: [],
          positionData: [],
          hitPositions: []
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
          
          // Generate heatmap data for each player - use all individual points
          let heatmapData: Array<{x: number, y: number, intensity: number}> = [];
          if (csvData?.positionData && csvData.positionData.length > 0) {
            // Create density map to calculate intensity for each point
            const densityRadius = 1.0; // Radius to consider for density calculation
            const positionData = csvData.positionData; // Store reference to avoid repeated checks
            
            heatmapData = positionData.map(point => {
              // Calculate local density (number of nearby points)
              const nearbyPoints = positionData.filter(otherPoint => {
                const distance = Math.sqrt(
                  Math.pow(point.x - otherPoint.x, 2) + 
                  Math.pow(point.y - otherPoint.y, 2)
                );
                return distance <= densityRadius;
              });
              
              return {
                x: point.x,
                y: point.y,
                intensity: nearbyPoints.length
              };
            });
            
            // Normalize intensities to 0-1 range
            const maxIntensity = Math.max(...heatmapData.map(d => d.intensity));
            if (maxIntensity > 0) {
              heatmapData = heatmapData.map(d => ({
                ...d,
                intensity: d.intensity / maxIntensity
              }));
            }
          }
          
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
            heatmapData: heatmapData
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
  const PLAYER_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44']; // Red, Green, Blue, Yellow

  // PDF Generation Function
  const generatePDFReport = async () => {
    if (!matchData) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Store current tab to restore later
      const originalTab = activeTab;
      
      // Helper function to capture element as image
      const captureElement = async (element: HTMLElement, title: string): Promise<{ imgData: string, width: number, height: number } | null> => {
        try {
          const canvas = await html2canvas(element, {
            backgroundColor: 'white',
            scale: 0.8,
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          return { imgData, width: imgWidth, height: imgHeight };
        } catch (error) {
          console.warn(`Could not capture ${title}:`, error);
          return null;
        }
      };


      
      // Helper function to add styled section header
      const addSectionHeader = (title: string, isMainTitle = false, forceNewPage = false) => {
        if (forceNewPage) {
          pdf.addPage();
          yPosition = 20; // Standard top margin for new pages
        }
        
        if (isMainTitle) {
          // Main section title - always at top with consistent spacing
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, yPosition, pageWidth, 25, 'F');
          
          pdf.setFontSize(20);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont(undefined, 'bold');
          pdf.text(title, pageWidth / 2, yPosition + 16, { align: 'center' });
          pdf.setFont(undefined, 'normal');
          
          // Fixed spacing after main title
          yPosition += 40;
        } else {
          // Subsection header with consistent spacing
          pdf.setFillColor(236, 240, 241);
          pdf.setDrawColor(41, 128, 185);
          pdf.setLineWidth(1);
          pdf.rect(15, yPosition, pageWidth - 30, 20, 'FD');
          
          pdf.setFontSize(14);
          pdf.setTextColor(41, 128, 185);
          pdf.setFont(undefined, 'bold');
          pdf.text(title, 20, yPosition + 13);
          pdf.setFont(undefined, 'normal');
          
          // Fixed spacing after subsection header
          yPosition += 35;
        }
      };

      // Helper function to add styled stats box
      const addStatsBox = (stats: Array<{label: string, value: string}>, title?: string) => {
        const boxHeight = stats.length * 12 + 16;
        const totalHeight = (title ? 25 : 0) + boxHeight + 20; // Space needed
        
        if (yPosition + totalHeight > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20; // Standard margin
        }

        if (title) {
          pdf.setFontSize(14);
          pdf.setTextColor(52, 73, 94);
          pdf.setFont(undefined, 'bold');
          pdf.text(title, 20, yPosition);
          pdf.setFont(undefined, 'normal');
          yPosition += 20; // Standard spacing after title
        }

        // Background box
        pdf.setFillColor(248, 249, 250);
        pdf.setDrawColor(233, 236, 239);
        pdf.setLineWidth(1);
        pdf.rect(15, yPosition, pageWidth - 30, boxHeight, 'FD');

        // Add padding inside box
        yPosition += 10;

        pdf.setFontSize(11);
        stats.forEach((stat, index) => {
          pdf.setTextColor(52, 73, 94);
          pdf.text(`${stat.label}:`, 25, yPosition);
          
          pdf.setTextColor(41, 128, 185);
          pdf.setFont(undefined, 'bold');
          pdf.text(stat.value, 25 + pdf.getTextWidth(`${stat.label}: `), yPosition);
          pdf.setFont(undefined, 'normal');
          
          yPosition += 12; // Consistent line spacing
        });
        
        yPosition += 20; // Standard space after stats box
      };

      // Helper function to add image to PDF with styling
      const addImageToPDF = (imgData: string, width: number, height: number, title: string) => {
        const totalHeight = 25 + height + 25; // Title + image + spacing
        
        if (yPosition + totalHeight > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20; // Standard margin
        }
        
        // Chart title with background
        pdf.setFillColor(236, 240, 241);
        pdf.setDrawColor(189, 195, 199);
        pdf.setLineWidth(1);
        pdf.rect(15, yPosition, pageWidth - 30, 20, 'FD');
        
        pdf.setFontSize(12);
        pdf.setTextColor(44, 62, 80);
        pdf.setFont(undefined, 'bold');
        pdf.text(title, 20, yPosition + 13);
        pdf.setFont(undefined, 'normal');
        yPosition += 25; // Standard spacing after title
        
        // Add border around image
        pdf.setDrawColor(189, 195, 199);
        pdf.setLineWidth(1);
        pdf.rect(18, yPosition - 2, width + 4, height + 4, 'D');
        
        pdf.addImage(imgData, 'PNG', 20, yPosition, width, height);
        yPosition += height + 25; // Standard space after chart
      };
      
      // COVER PAGE - Match Information
      yPosition = pageHeight / 2 - 40; // Center vertically
      
      // Main title
      pdf.setFillColor(41, 128, 185);
      pdf.rect(0, yPosition - 15, pageWidth, 30, 'F');
      
      pdf.setFontSize(24);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      pdf.text('MATCH ANALYSIS REPORT', pageWidth / 2, yPosition, { align: 'center' });
      pdf.setFont(undefined, 'normal');
      
      // Match name
      pdf.setFontSize(20);
      pdf.setTextColor(52, 73, 94);
      pdf.setFont(undefined, 'bold');
      pdf.text(matchData.title, pageWidth / 2, yPosition + 40, { align: 'center' });
      pdf.setFont(undefined, 'normal');
      
      // Match date
      pdf.setFontSize(14);
      pdf.setTextColor(108, 117, 125);
      pdf.text(`Match Date: ${new Date(matchData.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, yPosition + 65, { align: 'center' });
      
      // Generation timestamp
      pdf.setFontSize(12);
      pdf.setTextColor(149, 165, 166);
      pdf.text(`Report generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, pageWidth / 2, yPosition + 85, { align: 'center' });
      
      // EXECUTIVE SUMMARY SECTION
      addSectionHeader('Executive Summary', true, true); // New page for content
      
      const totalDistance = matchData.players.reduce((sum, p) => sum + p.coveredDistance, 0);
      const totalHits = matchData.players.reduce((sum, p) => sum + p.totalHits, 0);
      const avgVelocity = matchData.players.reduce((sum, p) => sum + p.avgVelocity, 0) / matchData.players.length;
      const maxVelocity = Math.max(...matchData.players.map(p => p.maxVelocity));
      
      addStatsBox([
        { label: 'Match Duration', value: matchData.duration },
        { label: 'Total Player Distance', value: `${totalDistance.toFixed(2)} meters` },
        { label: 'Ball Travel Distance', value: `${matchData.ballStats.coveredDistance.toFixed(2)} meters` },
        { label: 'Total Ball Hits', value: totalHits.toString() },
        { label: 'Average Player Velocity', value: `${avgVelocity.toFixed(2)} m/s` },
        { label: 'Peak Player Velocity', value: `${maxVelocity.toFixed(2)} m/s` },
        { label: 'Total Rallies', value: matchData.ballStats.totalRallies.toString() },
        { label: 'Average Rally Length', value: `${matchData.ballStats.avgRallyLength.toFixed(1)} seconds` }
      ]);
      
      // PLAYER PERFORMANCE SECTION
      addSectionHeader('Player Performance Analysis', true, true); // New page with title at top
      
      matchData.players.forEach((player, index) => {
        addStatsBox([
          { label: 'Distance Covered', value: `${player.coveredDistance.toFixed(2)} m` },
          { label: 'Average Velocity', value: `${player.avgVelocity.toFixed(2)} m/s` },
          { label: 'Maximum Velocity', value: `${player.maxVelocity.toFixed(2)} m/s` },
          { label: 'Total Hits', value: player.totalHits.toString() },
          { label: 'Successful Hits', value: player.successfulHits.toString() },
          { label: 'Hit Accuracy', value: `${player.hitAccuracy.toFixed(1)}%` }
        ], `${player.name} (Team ${player.team})`);
      });
      
      // BALL ANALYTICS SECTION
      addSectionHeader('Ball Analytics', true, true); // New page with title at top
      
      addStatsBox([
        { label: 'Ball Distance', value: `${matchData.ballStats.coveredDistance.toFixed(2)} m` },
        { label: 'Average Velocity', value: `${matchData.ballStats.avgVelocity.toFixed(2)} m/s` },
        { label: 'Maximum Velocity', value: `${matchData.ballStats.maxVelocity.toFixed(2)} m/s` },
        { label: 'Average Acceleration', value: `${matchData.ballStats.avgAcceleration.toFixed(2)} m/s²` },
        { label: 'Maximum Acceleration', value: `${matchData.ballStats.maxAcceleration.toFixed(2)} m/s²` },
        { label: 'Ball Bounces', value: csvBallData.bounceCount.toString() }
      ]);
      
      // PERFORMANCE CHARTS SECTION  
      addSectionHeader('Performance Charts', true, true); // New page with title at top
      
      // CHART CAPTURE SECTION
      
      // Add subsection header for overview charts
      addSectionHeader('Overview Charts', false);
      
      // 1. OVERVIEW TAB CHARTS
      setActiveTab("overview");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for graphs to render
      
      // Capture all charts from overview
      const overviewCharts = document.querySelectorAll('.recharts-wrapper');
      for (let i = 0; i < overviewCharts.length; i++) {
        const chart = overviewCharts[i] as HTMLElement;
        const result = await captureElement(chart, `Overview Chart ${i + 1}`);
        if (result) {
          addImageToPDF(result.imgData, result.width, result.height, 
            i === 0 ? 'Player Velocity Over Time (Overview)' : 
            i === 1 ? 'Player Hits Distribution' : `Overview Chart ${i + 1}`);
        }
      }
      
      // Add subsection header for player charts
      addSectionHeader('Player Performance Charts', false);
      
      // 2. PLAYERS TAB CHARTS
      setActiveTab("players");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for graphs to render
      
      const playerCharts = document.querySelectorAll('.recharts-wrapper');
      for (let i = 0; i < playerCharts.length; i++) {
        const chart = playerCharts[i] as HTMLElement;
        const result = await captureElement(chart, `Player Chart ${i + 1}`);
        if (result) {
          addImageToPDF(result.imgData, result.width, result.height, 
            i === 0 ? 'Player Velocity Over Time (Detailed)' : 
            i === 1 ? 'Individual Player Statistics' : `Player Chart ${i + 1}`);
        }
      }
      
      // Add subsection header for ball analytics charts
      addSectionHeader('Ball Analytics Charts', false);
      
      // 3. BALL ANALYTICS TAB CHARTS
      setActiveTab("ball");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for graphs to render
      
      const ballCharts = document.querySelectorAll('.recharts-wrapper');
      for (let i = 0; i < ballCharts.length; i++) {
        const chart = ballCharts[i] as HTMLElement;
        const result = await captureElement(chart, `Ball Chart ${i + 1}`);
        if (result) {
          addImageToPDF(result.imgData, result.width, result.height, 
            i === 0 ? 'Ball Velocity Over Time' : 
            i === 1 ? 'Ball Acceleration Analysis' : `Ball Chart ${i + 1}`);
        }
      }
      
      // Restore original tab
      setActiveTab(originalTab);
      
      // STYLED FOOTER SECTION
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Footer background
        pdf.setFillColor(248, 249, 250);
        pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        
        // Footer border
        pdf.setDrawColor(233, 236, 239);
        pdf.setLineWidth(0.5);
        pdf.line(0, pageHeight - 20, pageWidth, pageHeight - 20);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(108, 117, 125);
        pdf.text(
          `Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          10,
          pageHeight - 8
        );
        
        // Page number
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - 10,
          pageHeight - 8,
          { align: 'right' }
        );
        
        // Company/App name
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(41, 128, 185);
        pdf.text(
          'Match Analytics Pro',
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
        pdf.setFont(undefined, 'normal');
      }
      
      // Save the PDF
      const fileName = `${matchData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis_report.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Heatmap component with smooth gradient visualization
  const HeatmapVisualization = ({ selectedPlayers, allPlayersData }: { 
    selectedPlayers: boolean[], 
    allPlayersData: Array<{x: number, y: number, intensity: number}[]> 
  }) => {
    // Check if any players are selected and have data
    const hasData = selectedPlayers.some((selected, index) => 
      selected && allPlayersData[index] && allPlayersData[index].length > 0
    );

    if (!hasData) {
      return (
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No Position Data Available</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select players or check that position data exists in CSV
            </p>
          </div>
        </div>
      );
    }

    // Dynamic court dimensions for visualization
    const getCourtDimensions = () => {
      const maxWidth = Math.min(window.innerWidth * 0.8, 800); // 80% of screen width, max 800px
      const aspectRatio = 4 / 3; // Height to width ratio (800/600)
      return {
        width: maxWidth,
        height: maxWidth * aspectRatio
      };
    };
    
    const { width: courtWidth, height: courtHeight } = getCourtDimensions();
    const xMin = -5, xMax = 5, yMin = -10, yMax = 10;
    
    // Scale functions to convert court coordinates to SVG coordinates
    const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * courtWidth;
    const yScale = (y: number) => ((yMax - y) / (yMax - yMin)) * courtHeight; // Invert Y for SVG

    // Create gradient definitions for smooth heatmap
    const gradientId = `heatmap-gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex justify-center">
        <div className="relative">
          <svg 
            width={courtWidth + 100} 
            height={courtHeight + 100} 
            className="border border-gray-300 rounded-lg"
            style={{ background: '#000027' }} // Very dark background
          >
            <defs>
              {/* Gaussian blur filter for smooth effect */}
              <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="12"/>
              </filter>
              
              {/* Radial gradients for each player and intensity level */}
              {PLAYER_COLORS.map((color, playerIndex) => 
                [0, 1, 2, 3, 4].map((level, levelIndex) => {
                  const baseOpacity = 0.2 + (level * 0.2); // 0.2, 0.4, 0.6, 0.8, 1.0
                  return (
                    <radialGradient key={`player-${playerIndex}-level-${level}`} id={`heat-${playerIndex}-${level}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={color} stopOpacity={baseOpacity} />
                      <stop offset="50%" stopColor={color} stopOpacity={baseOpacity * 0.7} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </radialGradient>
                  );
                })
              ).flat()}
            </defs>

            <g transform="translate(50, 50)">
              {/* Court background */}
              <rect 
                x={0} 
                y={0} 
                width={courtWidth} 
                height={courtHeight} 
                fill="#000027"
              />

              {/* Heatmap layer with smooth blobs */}
              <g filter="url(#blur)">
                {selectedPlayers.map((isSelected, playerIndex) => 
                  isSelected && allPlayersData[playerIndex] ? 
                    allPlayersData[playerIndex].map((point, pointIndex) => {
                      const intensityLevel = Math.floor(point.intensity * 4); // 0-4
                      const radius = 25 + (point.intensity * 35); // Even larger, overlapping circles
                      
                      return (
                        <circle
                          key={`player-${playerIndex}-point-${pointIndex}`}
                          cx={xScale(point.x)}
                          cy={yScale(point.y)}
                          r={radius}
                          fill={`url(#heat-${playerIndex}-${intensityLevel})`}
                          opacity={1.0}
                        />
                      );
                    }) : null
                ).flat().filter(Boolean)}
              </g>

              {/* Padel Court Lines - drawn on top */}
              <g stroke="#ffffff" fill="none" opacity="0.8">
                {/* Court boundary */}
                <rect 
                  x={0} 
                  y={0} 
                  width={courtWidth} 
                  height={courtHeight}
                  strokeWidth="3"
                />
                
                {/* Net line (center) - thicker to represent net */}
                <line 
                  x1={0} 
                  y1={courtHeight / 2} 
                  x2={courtWidth} 
                  y2={courtHeight / 2}
                  strokeWidth="4"
                />
                
                {/* Service boxes - closer to net (1/3 of each half) */}
                {/* Top service line */}
                <line 
                  x1={0} 
                  y1={courtHeight / 6} 
                  x2={courtWidth} 
                  y2={courtHeight / 6}
                  strokeWidth="2"
                />
                
                {/* Bottom service line */}
                <line 
                  x1={0} 
                  y1={courtHeight * 5 / 6} 
                  x2={courtWidth} 
                  y2={courtHeight * 5 / 6}
                  strokeWidth="2"
                />
                
                {/* Center service lines (dividing each half vertically) */}
                {/* Top half center service line */}
                <line 
                  x1={courtWidth / 2} 
                  y1={0} 
                  x2={courtWidth / 2} 
                  y2={courtHeight / 6}
                  strokeWidth="2"
                />
                
                {/* Bottom half center service line */}
                <line 
                  x1={courtWidth / 2} 
                  y1={courtHeight * 5 / 6} 
                  x2={courtWidth / 2} 
                  y2={courtHeight}
                  strokeWidth="2"
                />
              </g>
            </g>
          </svg>
          
          {/* Legend */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Players:</span>
              {PLAYER_COLORS.map((color, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Player {index + 1}
                  </span>
                </div>
              ))}
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-gray-600 dark:text-gray-400">Intensity:</span>
                <span className="text-gray-600 dark:text-gray-400">Low</span>
                <div className="flex space-x-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded"
                      style={{ 
                        backgroundColor: '#888',
                        opacity: opacity
                      }}
                    />
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

          <Button 
            variant="outline"
            onClick={generatePDFReport}
            disabled={isAnalysisNotAvailable || isGeneratingPDF || !matchData}
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>


        </div>
      </div>

      {/* Match Screenshot with Overlay - only when analysis not available */}
      {isAnalysisNotAvailable && match?.match_screenshot_url && (
        <div className="relative flex justify-center">
          <div className="w-full max-w-4xl">
            <img 
              src={match.match_screenshot_url} 
              alt="Match Screenshot"
              className="w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Analysis Not Available Overlay - positioned over screenshot */}
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-center p-8 bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-lg">
              <div className="mb-6">
                <Activity className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Analysis Not Available
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {match?.status === 'processing' 
                    ? 'Your match is currently being processed. This may take a few minutes.'
                    : match?.status === 'uploaded'
                    ? 'Your match has been uploaded and is queued for processing.'
                    : 'Match analysis is not ready yet.'}
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  <span>Processing...</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                You can watch the replay while waiting for analysis to complete.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Not Available Overlay for content area (when no screenshot) */}
      {isAnalysisNotAvailable && !match?.match_screenshot_url && (
        <div className="relative">
          <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <div className="text-center p-8">
              <div className="mb-6">
                <Activity className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Analysis Not Available
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {match?.status === 'processing' 
                    ? 'Your match is currently being processed. This may take a few minutes.'
                    : match?.status === 'uploaded'
                    ? 'Your match has been uploaded and is queued for processing.'
                    : 'Match analysis is not ready yet.'}
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  <span>Processing...</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                You can watch the replay while waiting for analysis to complete.
              </div>
            </div>
          </div>
          {/* Placeholder content to maintain layout */}
          <div className="min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg opacity-30">
            <div className="p-8 space-y-6">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={`flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${isAnalysisNotAvailable ? 'opacity-50 pointer-events-none' : ''}`}>
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
              onClick={() => !isAnalysisNotAvailable && setActiveTab(tab.id)}
              disabled={isAnalysisNotAvailable}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              } ${isAnalysisNotAvailable ? 'cursor-not-allowed' : ''}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {!isAnalysisNotAvailable && activeTab === "overview" && (
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
              <PlayerVelocityChart
                data={velocityOverTime}
                playerNames={matchData.players.map(p => p.name)}
                colors={["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]}
              />
            </CardContent>
          </Card>

          {/* Player Hits Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Player Hits</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerHitsBarChart data={playerHitsData} />
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {!isAnalysisNotAvailable && activeTab === "players" && (
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
              <PlayerVelocityChart
                data={velocityOverTime}
                playerNames={matchData.players.map(p => p.name)}
                colors={["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]}
              />
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

      {!isAnalysisNotAvailable && activeTab === "ball" && (
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
              <BallVelocityAccelerationChart data={ballVelocityData} />
            </CardContent>
          </Card>
        </div>
      )}

      {!isAnalysisNotAvailable && activeTab === "heatmap" && (
        <div className="space-y-6">
          {/* Heatmap Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Heatmap Analysis</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose a heatmap visualization to analyze movement and activity patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-3">
                {[
                  {
                    id: "multi-player" as const,
                    title: "Multi-Player Heatmap",
                    description: "Compare player movements with selectable overlays",
                    icon: "👥",
                    color: "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
                  },
                  {
                    id: "individual-players" as const,
                    title: "Individual Player Analysis",
                    description: "Detailed movement patterns for each player",
                    icon: "🎯",
                    color: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700"
                  },
                  {
                    id: "ball-movement" as const,
                    title: "Ball Movement Heatmap",
                    description: "Visualization of ball trajectory patterns",
                    icon: "🎾",
                    color: "bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-700"
                  },
                  {
                    id: "ball-hits" as const,
                    title: "Ball Hits Heatmap",
                    description: "Locations where ball contact occurs",
                    icon: "⚡",
                    color: "bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700"
                  }
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedHeatmap(option.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selectedHeatmap === option.id
                        ? `${option.color} border-opacity-100 shadow-lg transform scale-105`
                        : 'border-gray-200 dark:border-gray-700 hover:border-opacity-60 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium transition-colors duration-200 ${
                          selectedHeatmap === option.id 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {option.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                      {selectedHeatmap === option.id && (
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Multi-Player Heatmap */}
          {selectedHeatmap === "multi-player" && (
            <Card>
              <CardHeader>
                <CardTitle>Multi-Player Court Heatmap</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visualization of player movement patterns based on position data (x: -5 to 5, y: -10 to 10)
                </p>
              </CardHeader>
              <CardContent>
            {/* Player Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Players</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-4">
                {matchData.players.map((player, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      const newSelected = [...selectedPlayers];
                      newSelected[index] = !selectedPlayers[index];
                      setSelectedPlayers(newSelected);
                    }}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selectedPlayers[index]
                        ? 'border-opacity-100 shadow-lg transform scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-opacity-60'
                    }`}
                    style={{
                      borderColor: selectedPlayers[index] ? PLAYER_COLORS[index] : undefined,
                      backgroundColor: selectedPlayers[index] ? `${PLAYER_COLORS[index]}15` : undefined
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          selectedPlayers[index] ? 'border-white' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ 
                          backgroundColor: PLAYER_COLORS[index],
                          opacity: selectedPlayers[index] ? 1 : 0.6
                        }}
                      >
                        {selectedPlayers[index] && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium transition-colors duration-200 ${
                          selectedPlayers[index] 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {player.name}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {player.heatmapData.length} positions
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection indicator overlay */}
                    {selectedPlayers[index] && (
                      <div 
                        className="absolute top-2 right-2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: PLAYER_COLORS[index] }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <HeatmapVisualization 
              selectedPlayers={selectedPlayers} 
              allPlayersData={matchData.players.map(player => player.heatmapData)} 
            />
            
            {/* Additional stats for selected players */}
            {selectedPlayers.some((selected, index) => selected && matchData.players[index].heatmapData.length > 0) && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Selected Players Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
                  {selectedPlayers.map((isSelected, index) => 
                    isSelected && matchData.players[index].heatmapData.length > 0 ? (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4" style={{ borderLeftColor: PLAYER_COLORS[index] }}>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: PLAYER_COLORS[index] }} />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{matchData.players[index].name}</p>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Position Points</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{matchData.players[index].heatmapData.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Max Intensity</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {matchData.players[index].heatmapData.length > 0 ? Math.max(...matchData.players[index].heatmapData.map(d => d.intensity)).toFixed(2) : '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Intensity</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {matchData.players[index].heatmapData.length > 0 ? 
                                (matchData.players[index].heatmapData.reduce((sum, d) => sum + d.intensity, 0) / matchData.players[index].heatmapData.length).toFixed(2) : 
                                '0.00'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null
                  ).filter(Boolean)}
                </div>
              </div>
                )}
            </CardContent>
          </Card>
        )}

          {/* Individual Player Heatmaps */}
          {selectedHeatmap === "individual-players" && (
            <Card>
              <CardHeader>
                <CardTitle>Individual Player Heatmaps</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed movement patterns for each player with enhanced intensity visualization
                </p>
              </CardHeader>
              <CardContent>
            {/* Shared SVG definitions for all player heatmaps */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                {/* Shared enhanced color gradients for all players */}
                {[
                  '#0000ff', // Deep blue (lowest intensity)
                  '#0080ff', // Light blue
                  '#00ff80', // Green-cyan
                  '#80ff00', // Yellow-green
                  '#ffff00', // Yellow
                  '#ff8000', // Orange
                  '#ff0000'  // Red (highest intensity)
                ].map((color, colorIndex) => (
                  <radialGradient key={`shared-gradient-${colorIndex}`} id={`shared-heat-${colorIndex}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </radialGradient>
                ))}
              </defs>
            </svg>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-4">
              {matchData.players.map((player, playerIndex) => {
                const hasData = player.heatmapData && player.heatmapData.length > 0;
                
                if (!hasData) {
                  return (
                    <div key={playerIndex} className="text-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {player.name}
                      </h4>
                      <div className="flex items-center justify-center h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">No position data available</p>
                      </div>
                    </div>
                  );
                }

                // Dynamic court dimensions for individual heatmaps (smaller)
                const getIndividualCourtDimensions = () => {
                  const maxWidth = Math.min(window.innerWidth * 0.35, 400); // 35% of screen width, max 400px
                  const aspectRatio = 4 / 3; // Height to width ratio
                  return {
                    width: maxWidth,
                    height: maxWidth * aspectRatio
                  };
                };
                
                const { width: courtWidth, height: courtHeight } = getIndividualCourtDimensions();
                const xMin = -5, xMax = 5, yMin = -10, yMax = 10;
                
                // Scale functions
                const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * courtWidth;
                const yScale = (y: number) => ((yMax - y) / (yMax - yMin)) * courtHeight;

                                 // Shared color scale (7 levels)
                 const colorScaleLevels = 7;

                return (
                  <div key={playerIndex} className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {player.name}
                    </h4>
                    <div className="flex justify-center">
                      <svg 
                        width={courtWidth + 60} 
                        height={courtHeight + 60} 
                        className="border border-gray-300 rounded-lg"
                        style={{ background: '#000027' }}
                      >
                        <defs>
                          {/* Enhanced blur filter */}
                          <filter id={`blur-${playerIndex}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="5"/>
                          </filter>
                        </defs>

                        <g transform="translate(30, 30)">
                          {/* Court background */}
                          <rect 
                            x={0} 
                            y={0} 
                            width={courtWidth} 
                            height={courtHeight} 
                            fill="#000027"
                          />

                          {/* Heatmap points with enhanced color mapping */}
                          <g filter={`url(#blur-${playerIndex})`}>
                            {player.heatmapData.map((point, pointIndex) => {
                                                             // Map intensity to color scale (0-1 to 0-6)
                               const colorIndex = Math.min(Math.floor(point.intensity * colorScaleLevels), colorScaleLevels - 1);
                                                             const radius = 8 + (point.intensity * 12); // Smaller radius for individual views
                              
                              return (
                                <circle
                                  key={`player-${playerIndex}-point-${pointIndex}`}
                                  cx={xScale(point.x)}
                                  cy={yScale(point.y)}
                                  r={radius}
                                  fill={`url(#shared-heat-${colorIndex})`}
                                  opacity={0.8}
                                />
                              );
                            })}
                          </g>

                          {/* Padel Court Lines */}
                          <g stroke="#ffffff" fill="none" opacity="0.7">
                            {/* Court boundary */}
                            <rect 
                              x={0} 
                              y={0} 
                              width={courtWidth} 
                              height={courtHeight}
                              strokeWidth="2"
                            />
                            
                            {/* Net line (center) - thicker to represent net */}
                            <line 
                              x1={0} 
                              y1={courtHeight / 2} 
                              x2={courtWidth} 
                              y2={courtHeight / 2}
                              strokeWidth="3"
                            />
                            
                            {/* Service boxes - closer to net (1/3 of each half) */}
                            {/* Top service line */}
                            <line 
                              x1={0} 
                              y1={courtHeight / 6} 
                              x2={courtWidth} 
                              y2={courtHeight / 6}
                              strokeWidth="1.5"
                            />
                            
                            {/* Bottom service line */}
                            <line 
                              x1={0} 
                              y1={courtHeight * 5 / 6} 
                              x2={courtWidth} 
                              y2={courtHeight * 5 / 6}
                              strokeWidth="1.5"
                            />
                            
                            {/* Center service lines (dividing each half vertically) */}
                            {/* Top half center service line */}
                            <line 
                              x1={courtWidth / 2} 
                              y1={0} 
                              x2={courtWidth / 2} 
                              y2={courtHeight / 6}
                              strokeWidth="1.5"
                            />
                            
                            {/* Bottom half center service line */}
                            <line 
                              x1={courtWidth / 2} 
                              y1={courtHeight * 5 / 6} 
                              x2={courtWidth / 2} 
                              y2={courtHeight}
                              strokeWidth="1.5"
                            />
                          </g>
                        </g>
                      </svg>
                    </div>
                    
                    {/* Individual player stats */}
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400">Position Points</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {player.heatmapData.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400">Max Intensity</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.max(...player.heatmapData.map(d => d.intensity)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Color scale legend for this player */}
                    <div className="mt-3 flex justify-center">
                                             <div className="flex items-center space-x-1">
                         <span className="text-xs text-gray-500">Low</span>
                         {[
                           '#0000ff', // Deep blue
                           '#0080ff', // Light blue
                           '#00ff80', // Green-cyan
                           '#80ff00', // Yellow-green
                           '#ffff00', // Yellow
                           '#ff8000', // Orange
                           '#ff0000'  // Red
                         ].map((color, colorIndex) => (
                           <div
                             key={colorIndex}
                             className="w-4 h-3 border border-gray-300"
                             style={{ backgroundColor: color }}
                           />
                         ))}
                         <span className="text-xs text-gray-500">High</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
              </CardContent>
            </Card>
          )}

          {/* Ball Movement Heatmap */}
          {selectedHeatmap === "ball-movement" && (
        <Card>
          <CardHeader>
            <CardTitle>Ball Movement Heatmap</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualization of ball movement patterns across the court
            </p>
          </CardHeader>
          <CardContent>
            {csvBallData.positionData && csvBallData.positionData.length > 0 ? (
              (() => {
                // Dynamic court dimensions for ball movement heatmap
                const getCourtDimensions = () => {
                  const maxWidth = Math.min(window.innerWidth * 0.8, 800); // 80% of screen width, max 800px
                  const aspectRatio = 4 / 3; // Height to width ratio (800/600)
                  return {
                    width: maxWidth,
                    height: maxWidth * aspectRatio
                  };
                };
                
                const { width: courtWidth, height: courtHeight } = getCourtDimensions();
                
                return (
                  <div className="flex justify-center">
                    <div className="text-center">
                      <svg 
                        width={courtWidth + 100} 
                        height={courtHeight + 100} 
                        className="border border-gray-300 rounded-lg"
                        style={{ background: '#000027' }}
                      >
                    <defs>
                                             {/* Ball-specific blur filter - match main heatmap */}
                       <filter id="ball-blur" x="-50%" y="-50%" width="200%" height="200%">
                         <feGaussianBlur in="SourceGraphic" stdDeviation="12"/>
                       </filter>
                      
                                             {/* Ball color gradients - same as player heatmaps */}
                       {[
                         '#0000ff', // Deep blue (lowest intensity)
                         '#0080ff', // Light blue
                         '#00ff80', // Green-cyan
                         '#80ff00', // Yellow-green
                         '#ffff00', // Yellow
                         '#ff8000', // Orange
                         '#ff0000'  // Red (highest intensity)
                       ].map((color, colorIndex) => (
                        <radialGradient key={`ball-gradient-${colorIndex}`} id={`ball-heat-${colorIndex}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                          <stop offset="50%" stopColor={color} stopOpacity="0.5" />
                          <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </radialGradient>
                      ))}
                    </defs>

                    <g transform="translate(50, 50)">
                      {/* Court background */}
                      <rect 
                        x={0} 
                        y={0} 
                        width={courtWidth} 
                        height={courtHeight} 
                        fill="#000027"
                      />

                      {/* Ball position points with density-based coloring */}
                      <g filter="url(#ball-blur)">
                        {(() => {
                          // Calculate density for each ball position
                          const densityRadius = 1.5;
                          const ballHeatmapData = csvBallData.positionData.map(point => {
                            const nearbyPoints = csvBallData.positionData.filter(otherPoint => {
                              const distance = Math.sqrt(
                                Math.pow(point.x - otherPoint.x, 2) + 
                                Math.pow(point.y - otherPoint.y, 2)
                              );
                              return distance <= densityRadius;
                            });
                            return {
                              x: point.x,
                              y: point.y,
                              intensity: nearbyPoints.length
                            };
                          });

                          // Normalize intensities
                          const maxIntensity = Math.max(...ballHeatmapData.map(d => d.intensity));
                          const normalizedData = ballHeatmapData.map(d => ({
                            ...d,
                            intensity: maxIntensity > 0 ? d.intensity / maxIntensity : 0
                          }));

                          // Court scaling
                          const xMin = -5, xMax = 5, yMin = -10, yMax = 10;
                          const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * courtWidth;
                          const yScale = (y: number) => ((yMax - y) / (yMax - yMin)) * courtHeight;

                                                     return normalizedData.map((point, pointIndex) => {
                             const colorIndex = Math.min(Math.floor(point.intensity * 7), 6);
                             const radius = 25 + (point.intensity * 35); // Match main heatmap circle size
                            
                            return (
                              <circle
                                key={`ball-point-${pointIndex}`}
                                cx={xScale(point.x)}
                                cy={yScale(point.y)}
                                r={radius}
                                fill={`url(#ball-heat-${colorIndex})`}
                                opacity={0.7}
                              />
                            );
                          });
                        })()}
                      </g>

                      {/* Padel Court Lines */}
                      <g stroke="#ffffff" fill="none" opacity="0.8">
                        {/* Court boundary */}
                        <rect 
                          x={0} 
                          y={0} 
                          width={courtWidth} 
                          height={courtHeight}
                          strokeWidth="3"
                        />
                        
                        {/* Net line (center) - thicker to represent net */}
                        <line 
                          x1={0} 
                          y1={courtHeight / 2} 
                          x2={courtWidth} 
                          y2={courtHeight / 2}
                          strokeWidth="4"
                        />
                        
                        {/* Service boxes - closer to net (1/3 of each half) */}
                        {/* Top service line */}
                        <line 
                          x1={0} 
                          y1={courtHeight / 6} 
                          x2={courtWidth} 
                          y2={courtHeight / 6}
                          strokeWidth="2"
                        />
                        
                        {/* Bottom service line */}
                        <line 
                          x1={0} 
                          y1={courtHeight * 5 / 6} 
                          x2={courtWidth} 
                          y2={courtHeight * 5 / 6}
                          strokeWidth="2"
                        />
                        
                        {/* Center service lines (dividing each half vertically) */}
                        {/* Top half center service line */}
                        <line 
                          x1={courtWidth / 2} 
                          y1={0} 
                          x2={courtWidth / 2} 
                          y2={courtHeight / 6}
                          strokeWidth="2"
                        />
                        
                        {/* Bottom half center service line */}
                        <line 
                          x1={courtWidth / 2} 
                          y1={courtHeight * 5 / 6} 
                          x2={courtWidth / 2} 
                          y2={courtHeight}
                          strokeWidth="2"
                        />
                      </g>
                    </g>
                  </svg>
                  
                  {/* Ball stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm max-w-md mx-auto">
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">Position Points</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {csvBallData.positionData.length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">Avg Velocity</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {csvBallData.avgVelocity.toFixed(1)} m/s
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">Max Velocity</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {csvBallData.maxVelocity.toFixed(1)} m/s
                      </p>
                    </div>
                  </div>
                  
                  {/* Ball color legend */}
                  <div className="mt-3 flex justify-center">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Low Activity</span>
                                             {[
                         '#0000ff', // Deep blue
                         '#0080ff', // Light blue
                         '#00ff80', // Green-cyan
                         '#80ff00', // Yellow-green
                         '#ffff00', // Yellow
                         '#ff8000', // Orange
                         '#ff0000'  // Red
                       ].map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="w-4 h-3 border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <span className="text-xs text-gray-500">High Activity</span>
                    </div>
                  </div>
                </div>
              </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                <div className="text-center">
                  <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">No Ball Position Data Available</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Check that ball_x and ball_y data exists in CSV
                  </p>
                </div>
              </div>
            )}
              </CardContent>
            </Card>
          )}

          {/* Ball Hits Heatmap */}
          {selectedHeatmap === "ball-hits" && (
            <Card>
              <CardHeader>
                <CardTitle>Ball Hits Heatmap</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visualization of ball hit locations (when ball_hit = 1)
                </p>
              </CardHeader>
              <CardContent>
            {csvBallData.hitPositions && csvBallData.hitPositions.length > 0 ? (
              (() => {
                // Dynamic court dimensions for ball hits heatmap
                const getCourtDimensions = () => {
                  const maxWidth = Math.min(window.innerWidth * 0.8, 800); // 80% of screen width, max 800px
                  const aspectRatio = 4 / 3; // Height to width ratio (800/600)
                  return {
                    width: maxWidth,
                    height: maxWidth * aspectRatio
                  };
                };
                
                const { width: courtWidth, height: courtHeight } = getCourtDimensions();
                
                return (
                  <div className="flex justify-center">
                    <div className="text-center">
                      <svg 
                        width={courtWidth + 100} 
                        height={courtHeight + 100} 
                        className="border border-gray-300 rounded-lg"
                        style={{ background: '#000027' }}
                      >
                    <defs>
                      {/* Ball hits specific blur filter */}
                      <filter id="ball-hits-blur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="12"/>
                      </filter>
                      
                      {/* Ball hits color gradients - same as other heatmaps */}
                      {[
                        '#0000ff', // Deep blue (lowest intensity)
                        '#0080ff', // Light blue
                        '#00ff80', // Green-cyan
                        '#80ff00', // Yellow-green
                        '#ffff00', // Yellow
                        '#ff8000', // Orange
                        '#ff0000'  // Red (highest intensity)
                      ].map((color, colorIndex) => (
                        <radialGradient key={`ball-hits-gradient-${colorIndex}`} id={`ball-hits-heat-${colorIndex}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                          <stop offset="50%" stopColor={color} stopOpacity="0.5" />
                          <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </radialGradient>
                      ))}
                    </defs>

                    <g transform="translate(50, 50)">
                      {/* Court background */}
                      <rect 
                        x={0} 
                        y={0} 
                        width={courtWidth} 
                        height={courtHeight} 
                        fill="#000027"
                      />

                      {/* Ball hit points with density-based coloring */}
                      <g filter="url(#ball-hits-blur)">
                        {(() => {
                          // Calculate density for each ball hit position
                          const densityRadius = 1.5;
                          const ballHitsHeatmapData = csvBallData.hitPositions.map(point => {
                            const nearbyPoints = csvBallData.hitPositions.filter(otherPoint => {
                              const distance = Math.sqrt(
                                Math.pow(point.x - otherPoint.x, 2) + 
                                Math.pow(point.y - otherPoint.y, 2)
                              );
                              return distance <= densityRadius;
                            });
                            return {
                              x: point.x,
                              y: point.y,
                              intensity: nearbyPoints.length
                            };
                          });

                          // Normalize intensities
                          const maxIntensity = Math.max(...ballHitsHeatmapData.map(d => d.intensity));
                          const normalizedData = ballHitsHeatmapData.map(d => ({
                            ...d,
                            intensity: maxIntensity > 0 ? d.intensity / maxIntensity : 0
                          }));

                          // Court scaling
                          const xMin = -5, xMax = 5, yMin = -10, yMax = 10;
                          const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * courtWidth;
                          const yScale = (y: number) => ((yMax - y) / (yMax - yMin)) * courtHeight;

                          return normalizedData.map((point, pointIndex) => {
                            const colorIndex = Math.min(Math.floor(point.intensity * 7), 6);
                            const radius = 25 + (point.intensity * 35);
                            
                            return (
                              <circle
                                key={`ball-hit-point-${pointIndex}`}
                                cx={xScale(point.x)}
                                cy={yScale(point.y)}
                                r={radius}
                                fill={`url(#ball-hits-heat-${colorIndex})`}
                                opacity={0.7}
                              />
                            );
                          });
                        })()}
                      </g>

                      {/* Padel Court Lines */}
                      <g stroke="#ffffff" fill="none" opacity="0.8">
                        {/* Court boundary */}
                        <rect 
                          x={0} 
                          y={0} 
                          width={courtWidth} 
                          height={courtHeight}
                          strokeWidth="3"
                        />
                        
                        {/* Net line (center) - thicker to represent net */}
                        <line 
                          x1={0} 
                          y1={courtHeight / 2} 
                          x2={courtWidth} 
                          y2={courtHeight / 2}
                          strokeWidth="4"
                        />
                        
                        {/* Service boxes - closer to net (1/3 of each half) */}
                        {/* Top service line */}
                        <line 
                          x1={0} 
                          y1={courtHeight / 6} 
                          x2={courtWidth} 
                          y2={courtHeight / 6}
                          strokeWidth="2"
                        />
                        
                        {/* Bottom service line */}
                        <line 
                          x1={0} 
                          y1={courtHeight * 5 / 6} 
                          x2={courtWidth} 
                          y2={courtHeight * 5 / 6}
                          strokeWidth="2"
                        />
                        
                        {/* Center service lines (dividing each half vertically) */}
                        {/* Top half center service line */}
                        <line 
                          x1={courtWidth / 2} 
                          y1={0} 
                          x2={courtWidth / 2} 
                          y2={courtHeight / 6}
                          strokeWidth="2"
                        />
                        
                        {/* Bottom half center service line */}
                        <line 
                          x1={courtWidth / 2} 
                          y1={courtHeight * 5 / 6} 
                          x2={courtWidth / 2} 
                          y2={courtHeight}
                          strokeWidth="2"
                        />
                      </g>
                    </g>
                  </svg>
                  
                  {/* Ball hits stats */}
                  <div className="mt-4 text-center">
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">Total Ball Hits</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {csvBallData.hitPositions.length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Ball hits color legend */}
                  <div className="mt-3 flex justify-center">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Low Density</span>
                      {[
                        '#0000ff', // Deep blue
                        '#0080ff', // Light blue
                        '#00ff80', // Green-cyan
                        '#80ff00', // Yellow-green
                        '#ffff00', // Yellow
                        '#ff8000', // Orange
                        '#ff0000'  // Red
                      ].map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="w-4 h-3 border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <span className="text-xs text-gray-500">High Density</span>
                    </div>
                  </div>
                </div>
              </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-96 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg">
                <div className="text-center">
                  <Target className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">No Ball Hit Data Available</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Check that ball_hit data exists in CSV
                  </p>
                </div>
              </div>
            )}
              </CardContent>
            </Card>
          )}
        </div>
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