'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, MessageSquare, HandHelping, Clock, Coins, RefreshCcw, Download, Sparkles, TrendingUp, Cpu, Server, Globe2, MessageCircleQuestion, HelpCircle, BarChart4, Target } from "lucide-react"
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let fromDate = "";
      let toDate = "";
      
      const now = new Date();
      if (timeFilter === "today") {
        fromDate = startOfDay(now).toISOString();
        toDate = endOfDay(now).toISOString();
      } else if (timeFilter === "yesterday") {
        const yest = subDays(now, 1);
        fromDate = startOfDay(yest).toISOString();
        toDate = endOfDay(yest).toISOString();
      } else if (timeFilter === "7d") {
        fromDate = subDays(now, 7).toISOString();
      } else if (timeFilter === "30d") {
        fromDate = subDays(now, 30).toISOString();
      } else if (timeFilter === "90d") {
        fromDate = subDays(now, 90).toISOString();
      } else if (timeFilter === "thisMonth") {
        fromDate = startOfMonth(now).toISOString();
        toDate = endOfMonth(now).toISOString();
      } else if (timeFilter === "lastMonth") {
        const lastM = subMonths(now, 1);
        fromDate = startOfMonth(lastM).toISOString();
        toDate = endOfMonth(lastM).toISOString();
      } else if (timeFilter === "custom") {
        if (customRange.from) fromDate = new Date(customRange.from).toISOString();
        if (customRange.to) toDate = new Date(customRange.to).toISOString();
      }

      let url = '/api/ai-assistant/analytics?';
      if (fromDate) url += `from=${fromDate}&`;
      if (toDate) url += `to=${toDate}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeFilter !== "custom") {
      fetchAnalytics();
    }
  }, [timeFilter]);

  const handleCustomApply = () => {
    fetchAnalytics();
  };

  const exportCSV = () => {
    if (!metrics?.timeSeriesData) return;
    
    // Create CSV header
    let csv = "Date,Total AI Replies,Human Handoffs,Estimated Cost ($)\n";
    
    // Add rows
    metrics.timeSeriesData.forEach((row: any) => {
      csv += `${row.date},${row.replies},${row.handoffs},${row.cost}\n`;
    });
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderEmptyState = (title: string, desc: string, icon: any = Sparkles) => {
    const Icon = icon;
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-950/20 rounded-xl border border-dashed border-zinc-800">
        <Icon className="w-8 h-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">{desc}</p>
      </div>
    );
  };

  const statCards = metrics ? [
    { title: "Total AI Replies", value: metrics.totalReplies, icon: MessageSquare, desc: "Across all conversations" },
    { title: "Human Handoffs", value: metrics.humanHandoffs, icon: HandHelping, desc: "Escalated to agents" },
    { title: "Avg Response Time", value: `${metrics.avgResponseTime}ms`, icon: Clock, desc: "End-to-end latency" },
    { title: "Est. Cost", value: `$${metrics.totalCost.toFixed(4)}`, icon: Coins, desc: "API usage cost" },
    { title: "Avg Tokens / Reply", value: metrics.avgTokens, icon: Activity, desc: "Prompt + Completion" },
    { title: "AI Attributed Revenue", value: `$${metrics.revenueAttribution?.toLocaleString() || 0}`, icon: TrendingUp, desc: "Won deals with AI involvement", textClass: "text-green-500" },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Intelligence Dashboard</h2>
          <p className="text-sm text-muted-foreground">Enterprise AI performance, cost, and conversational metrics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {timeFilter === "custom" && (
            <div className="flex items-center gap-2 mr-2">
              <Input type="date" className="h-9 w-auto text-xs" value={customRange.from} onChange={e => setCustomRange({...customRange, from: e.target.value})} />
              <span className="text-muted-foreground text-xs">to</span>
              <Input type="date" className="h-9 w-auto text-xs" value={customRange.to} onChange={e => setCustomRange({...customRange, to: e.target.value})} />
              <Button size="sm" variant="secondary" onClick={handleCustomApply}>Apply</Button>
            </div>
          )}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="h-9" onClick={exportCSV} disabled={!metrics || metrics.timeSeriesData?.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="animate-pulse bg-muted/20 border-border/50 shadow-none"><CardContent className="h-28"></CardContent></Card>
          ))}
        </div>
      ) : metrics ? (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="bg-card shadow-sm border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                      <Icon className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold tracking-tight ${stat.textClass || 'text-foreground'}`}>{stat.value}</h3>
                      <p className="text-xs text-muted-foreground/70 mt-1">{stat.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> AI Replies & Handoffs Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.timeSeriesData?.length > 0 ? (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorHandoffs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                        <Area type="monotone" dataKey="replies" name="AI Replies" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReplies)" />
                        <Area type="monotone" dataKey="handoffs" name="Human Handoffs" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHandoffs)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  renderEmptyState("No Activity Data", "No AI replies or handoffs recorded in this time range.")
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Coins className="w-4 h-4 text-emerald-500" /> AI Cost Trend (USD)</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.timeSeriesData?.length > 0 && metrics.totalCost > 0 ? (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          formatter={(value: number) => [`$${value.toFixed(4)}`, 'Estimated Cost']}
                        />
                        <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  renderEmptyState("No Cost Data", "No API costs incurred in this time range.")
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Server className="w-4 h-4 text-indigo-400" /> Provider Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(metrics.providerUsage || {}).length === 0 ? (
                  renderEmptyState("No Provider Data", "No API requests made yet.", Server)
                ) : (
                  <div className="space-y-4">
                    {Object.entries(metrics.providerUsage).map(([k,v]) => {
                      const total = Object.values(metrics.providerUsage).reduce((a:any,b:any)=>a+b, 0) as number;
                      const percent = Math.round((v as number / total) * 100);
                      return (
                        <div key={k} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{k}</span>
                            <span className="text-muted-foreground">{v as number} reqs ({percent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-orange-400" /> Model Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(metrics.modelUsage || {}).length === 0 ? (
                  renderEmptyState("No Model Data", "No models utilized yet.", Cpu)
                ) : (
                  <div className="space-y-4">
                    {Object.entries(metrics.modelUsage).map(([k,v]) => {
                      const total = Object.values(metrics.modelUsage).reduce((a:any,b:any)=>a+b, 0) as number;
                      const percent = Math.round((v as number / total) * 100);
                      return (
                        <div key={k} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-mono text-xs">{k}</span>
                            <span className="text-muted-foreground">{v as number} reqs</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Semantic Intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe2 className="w-4 h-4 text-blue-400" /> Language Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(metrics.languageDistribution || {}).length === 0 ? (
                  renderEmptyState("No Language Data", "No linguistic data detected yet.", Globe2)
                ) : (
                  <div className="space-y-4">
                    {Object.entries(metrics.languageDistribution).sort((a:any,b:any) => b[1]-a[1]).map(([k,v]) => {
                      const total = Object.values(metrics.languageDistribution).reduce((a:any,b:any)=>a+b, 0) as number;
                      const percent = Math.round((v as number / total) * 100);
                      return (
                        <div key={k} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{k}</span>
                            <span className="text-muted-foreground">{v as number} users ({percent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><MessageCircleQuestion className="w-4 h-4 text-purple-400" /> Top Customer Intents</CardTitle>
              </CardHeader>
              <CardContent>
                {!metrics.topQuestions || metrics.topQuestions.length === 0 ? (
                  renderEmptyState("No Intent Data", "No intents classified yet.", MessageCircleQuestion)
                ) : (
                  <div className="space-y-4">
                    {metrics.topQuestions.map((q: any, i: number) => {
                      const total = metrics.topQuestions.reduce((sum: number, item: any) => sum + item.count, 0);
                      const percent = Math.round((q.count / total) * 100);
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium truncate max-w-[200px]">{q.intent}</span>
                            <span className="text-muted-foreground">{q.count} queries</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


          {/* Future Ready Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 tracking-tight">Enterprise Intelligence <Badge variant="outline" className="ml-2 text-[10px] uppercase font-normal text-muted-foreground border-zinc-700">Coming Soon</Badge></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "AI Confidence Score", icon: Target },
                { title: "AI Business Insights", icon: HelpCircle },
                { title: "Customer Satisfaction", icon: Sparkles },
                { title: "Knowledge Base Analytics", icon: Activity },
                { title: "ROI Analytics", icon: TrendingUp },
                { title: "Agent Performance", icon: BarChart4 }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Card key={idx} className="bg-zinc-950/50 border-zinc-800/50 border-dashed opacity-70">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Icon className="w-4 h-4" /> {item.title}</CardTitle></CardHeader>
                    <CardContent><p className="text-xs text-muted-foreground">Collecting Data...</p></CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border">
          <Activity className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">Error</h3>
          <p className="text-sm text-muted-foreground">Failed to load analytics data.</p>
        </div>
      )}
    </div>
  )
}
