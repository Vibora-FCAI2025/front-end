import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Play, Search, Filter, Calendar, Upload, FileText, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, MatchResponse, PaginatedMatchResponse, PaginationInfo } from "../../lib/api";

interface MatchVideo {
  id: string;
  title: string;
  opponent: string;
  date: string;
  duration: string;
  thumbnail: string;
  status: "processed" | "processing" | "failed" | "pending" | "queued";
  result: "win" | "loss" | "draw";
  score: string;
}

export const VideoHistory = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchMatchHistory = async (page = 1, isRefresh = false) => {
    if (!token) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      
      const response = await apiClient.getMatchHistory(token, page, 12);
      setMatchHistory(response.matches);
      setPagination(response.pagination);
      setCurrentPage(page);
      
      // Transform API response to match our interface
      const transformedVideos: MatchVideo[] = response.matches.map((match, index) => {
        const matchDate = new Date(match.date);
        
        return {
          id: match.id,
          title: match.title || matchDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          opponent: "Opponent", // This would come from the backend later
          date: match.date,
        duration: "1:30:00", // This would come from the backend
        thumbnail: match.match_screenshot_url || "", // Use screenshot or empty for placeholder
        status: match.status === "finished" ? "processed" : 
                match.status === "processing" ? "processing" : 
                match.status === "queued" ? "queued" :
                match.status === "pending" ? "pending" : "failed",
        result: "win" as const, // This would come from the backend
        score: "6-4, 6-2", // This would come from the backend
      };
    });
      
      setVideos(transformedVideos);
    } catch (err) {
      setError("Failed to load match history");
      console.error("Error fetching match history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatchHistory(1);
  }, [token]);

  const handlePageChange = (page: number) => {
    fetchMatchHistory(page);
  };

  const handleRefresh = () => {
    fetchMatchHistory(currentPage, true);
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.opponent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || video.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed": 
      case "finished": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "processing": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "queued": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "pending": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
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
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
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
                <option value="pending">Pending</option>
                <option value="queued">Queued</option>
                <option value="processing">Processing</option>
                <option value="processed">Processed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card 
            key={video.id} 
            className="overflow-hidden hover-glow hover-lift cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600"
            onClick={() => {
              // Navigate to match analytics page
              navigate(`/analytics/${video.id}`);
            }}
            title="Click to view match details and analytics"
          >
            <div className="relative">
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={`Match screenshot for ${video.title}`}
                  className="w-full h-48 object-cover transition-transform hover:scale-105"
                  onError={(e) => {
                    // If screenshot fails to load, show fallback div
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLDivElement;
                    if (fallback && fallback.classList.contains('screenshot-fallback')) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className="screenshot-fallback w-full h-48 bg-gradient-to-br from-blue-100 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400"
                style={{ display: video.thumbnail ? 'none' : 'flex' }}
              >
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Match Screenshot</p>
                  <p className="text-xs mt-1 opacity-75">No screenshot available</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                {video.status === "processed" && (
                  <a 
                    href={matchHistory.find(m => m.id === video.id)?.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" className="bg-white text-black hover:bg-gray-50">
                      <Play className="h-4 w-4 mr-2" />
                      Watch
                    </Button>
                  </a>
                )}
                {video.status === "processing" && (
                  <Button size="sm" disabled className="bg-white text-black opacity-50">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing
                  </Button>
                )}
                {video.status === "pending" && (
                  <Button size="sm" disabled className="bg-white text-black opacity-50">
                    <div className="animate-pulse h-4 w-4 bg-current rounded mr-2"></div>
                    Pending
                  </Button>
                )}
                {video.status === "queued" && (
                  <Button size="sm" disabled className="bg-white text-black opacity-50">
                    <div className="animate-bounce h-4 w-4 bg-current rounded mr-2"></div>
                    Queued
                  </Button>
                )}
                {video.status === "failed" && (
                  <Button size="sm" disabled className="bg-white text-black opacity-50">
                    Failed
                  </Button>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Badge className={getStatusColor(video.status)}>
                  {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                </Badge>
              </div>

            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{video.title}</h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(video.date).toLocaleDateString()}
                </div>
              </div>



              <div className="mt-4 pt-4 border-t">
                {video.status === "processed" ? (
                  <Link to={`/analytics/${video.id}`} className="w-full" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" className="w-full">
                      View Analytics
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled className="w-full">
                    {video.status === "processing" && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Processing
                      </>
                    )}
                    {video.status === "pending" && (
                      <>
                        <div className="animate-pulse h-4 w-4 bg-current rounded mr-2"></div>
                        Pending
                      </>
                    )}
                    {video.status === "queued" && (
                      <>
                        <div className="animate-bounce h-4 w-4 bg-current rounded mr-2"></div>
                        Queued
                      </>
                    )}
                    {video.status === "failed" && "Failed"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.total_pages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total_items)} of{' '}
                {pagination.total_items} matches
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.has_previous || loading}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(
                      pagination.total_pages - 4,
                      Math.max(1, currentPage - 2)
                    )) + i;
                    
                    if (pageNumber > pagination.total_pages) return null;
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        disabled={loading}
                        className="w-10"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.has_next || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredVideos.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Play className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Upload your first video to get started with match analysis."
              }
            </p>
            {(!searchTerm && filterStatus === "all") && (
              <Link to="/upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};