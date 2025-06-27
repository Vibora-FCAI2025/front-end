import React, { useState } from 'react';
import { Calendar, FileText, Download, Mail, Settings, BarChart3, User, Users, Clock } from 'lucide-react';

interface ReportConfig {
  type: 'match' | 'player' | 'team';
  format: 'pdf' | 'excel' | 'powerpoint' | 'web';
  dateRange: { start: string; end: string };
  selectedMatches: string[];
  selectedPlayers: string[];
  metrics: string[];
  template: string;
  includeCharts: boolean;
  includeSummary: boolean;
}

export const ReportGeneration: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'match',
    format: 'pdf',
    dateRange: { start: '', end: '' },
    selectedMatches: [],
    selectedPlayers: [],
    metrics: ['shots', 'accuracy', 'coverage'],
    template: 'standard',
    includeCharts: true,
    includeSummary: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);

  const reportTypes = [
    { id: 'match', name: 'Individual Match', icon: FileText, description: 'Detailed analysis of a specific match' },
    { id: 'player', name: 'Player Progression', icon: User, description: 'Performance trends over time' },
    { id: 'team', name: 'Team Analysis', icon: Users, description: 'Comparative team performance' },
  ];

  const formatOptions = [
    { id: 'pdf', name: 'PDF Report', icon: FileText, description: 'Professional document format' },
    { id: 'excel', name: 'Excel Spreadsheet', icon: BarChart3, description: 'Data analysis friendly' },
    { id: 'powerpoint', name: 'PowerPoint', icon: FileText, description: 'Presentation ready' },
    { id: 'web', name: 'Web Link', icon: Mail, description: 'Shareable online report' },
  ];

  const availableMetrics = [
    { id: 'shots', name: 'Shot Analysis', category: 'Performance' },
    { id: 'accuracy', name: 'Accuracy Metrics', category: 'Performance' },
    { id: 'coverage', name: 'Court Coverage', category: 'Movement' },
    { id: 'speed', name: 'Movement Speed', category: 'Movement' },
    { id: 'heatmaps', name: 'Heat Maps', category: 'Visualization' },
    { id: 'patterns', name: 'Tactical Patterns', category: 'Strategy' },
  ];

  const mockMatches = [
    { id: '1', date: '2024-01-15', players: 'Ahmed vs Mohamed', duration: '45min' },
    { id: '2', date: '2024-01-14', players: 'Sara vs Fatima', duration: '52min' },
    { id: '3', date: '2024-01-13', players: 'Omar vs Khaled', duration: '38min' },
  ];

  const mockPlayers = [
    { id: '1', name: 'Ahmed Hassan', matches: 15 },
    { id: '2', name: 'Sara Mohamed', matches: 12 },
    { id: '3', name: 'Omar Ali', matches: 18 },
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newReport = {
      id: Date.now().toString(),
      name: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Report`,
      format: config.format,
      generatedAt: new Date().toLocaleString(),
      size: '2.3 MB',
      downloadUrl: '#',
    };
    
    setGeneratedReports(prev => [newReport, ...prev]);
    setIsGenerating(false);
  };

  const toggleMetric = (metricId: string) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const toggleMatch = (matchId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedMatches: prev.selectedMatches.includes(matchId)
        ? prev.selectedMatches.filter(m => m !== matchId)
        : [...prev.selectedMatches, matchId]
    }));
  };

  const togglePlayer = (playerId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedPlayers: prev.selectedPlayers.includes(playerId)
        ? prev.selectedPlayers.filter(p => p !== playerId)
        : [...prev.selectedPlayers, playerId]
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Report Generation</h1>
        <p className="text-muted-foreground">Create custom reports and export your match analytics</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Type Selection */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Report Type</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {reportTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div
                    key={type.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      config.type === type.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, type: type.id as any }))}
                  >
                    <IconComponent className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground mb-1">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Date Range</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                <input
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Content Selection */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Select Content</h2>
            <div className="space-y-4">
              {/* Matches Selection */}
              <div>
                <h3 className="font-medium text-foreground mb-2">Matches</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mockMatches.map((match) => (
                    <label key={match.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.selectedMatches.includes(match.id)}
                        onChange={() => toggleMatch(match.id)}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">{match.date} - {match.players}</span>
                      <span className="text-xs text-muted-foreground">({match.duration})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Players Selection */}
              <div>
                <h3 className="font-medium text-foreground mb-2">Players</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mockPlayers.map((player) => (
                    <label key={player.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.selectedPlayers.includes(player.id)}
                        onChange={() => togglePlayer(player.id)}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">{player.name}</span>
                      <span className="text-xs text-muted-foreground">({player.matches} matches)</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Selection */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Metrics to Include</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(
                availableMetrics.reduce((acc, metric) => {
                  if (!acc[metric.category]) acc[metric.category] = [];
                  acc[metric.category].push(metric);
                  return acc;
                }, {} as Record<string, typeof availableMetrics>)
              ).map(([category, metrics]) => (
                <div key={category}>
                  <h3 className="font-medium text-foreground mb-2">{category}</h3>
                  <div className="space-y-2">
                    {metrics.map((metric) => (
                      <label key={metric.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.metrics.includes(metric.id)}
                          onChange={() => toggleMetric(metric.id)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">{metric.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Export Format</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {formatOptions.map((format) => {
                const IconComponent = format.icon;
                return (
                  <div
                    key={format.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      config.format === format.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, format: format.id as any }))}
                  >
                    <IconComponent className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground mb-1">{format.name}</h3>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Generate Button */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Generate Report</h2>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || config.selectedMatches.length === 0}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Report
                </>
              )}
            </button>
            <p className="text-sm text-muted-foreground mt-2">
              Select at least one match to generate a report
            </p>
          </div>

          {/* Recent Reports */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Reports</h2>
            {generatedReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No reports generated yet</p>
            ) : (
              <div className="space-y-3">
                {generatedReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground text-sm">{report.name}</h3>
                      <span className="text-xs text-muted-foreground uppercase">{report.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{report.generatedAt}</span>
                      <span>{report.size}</span>
                    </div>
                    <button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Options</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeCharts}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Include Charts</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeSummary}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeSummary: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Include Summary</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 