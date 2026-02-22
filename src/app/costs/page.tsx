'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CostData {
  ok: boolean;
  today: {
    cost: number;
    input: number;
    output: number;
    percentChange: number;
    isOverBudget: boolean;
  };
  week: {
    total: number;
    average: number;
  };
  monthlyProjection: number;
  dailyBudget: number;
  daily: Array<{ date: string; cost: number; input: number; output: number }>;
  byProject: Array<{ name: string; cost: number; percentage: number; input: number; output: number }>;
}

export default function CostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCosts() {
    try {
      const res = await fetch('/api/costs');
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch costs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchCosts();
    // Refresh every 2 minutes
    const interval = setInterval(fetchCosts, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCosts();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Cost Center" subtitle="Track and analyze AI spending" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Cost Center" subtitle="Track and analyze AI spending" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Failed to load cost data</p>
        </div>
      </div>
    );
  }

  const { today, week, monthlyProjection, dailyBudget, daily, byProject } = data;

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Cost Center" 
        subtitle="Track and analyze AI spending"
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`border-zinc-800 ${today.isOverBudget ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Today</p>
                  <p className="text-3xl font-bold text-white">${today.cost.toFixed(2)}</p>
                </div>
                {today.isOverBudget && (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {Number(today.percentChange) > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className={Number(today.percentChange) > 0 ? 'text-red-500' : 'text-green-500'}>
                  {today.percentChange}% vs yesterday
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                {(today.input / 1000).toFixed(0)}k in · {(today.output / 1000).toFixed(0)}k out
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">This Week</p>
              <p className="text-3xl font-bold text-white">${week.total.toFixed(2)}</p>
              <p className="text-sm text-zinc-500 mt-2">
                Avg: ${week.average.toFixed(2)}/day
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">Monthly Projection</p>
              <p className="text-3xl font-bold text-white">${monthlyProjection.toFixed(0)}</p>
              <p className="text-sm text-zinc-500 mt-2">
                Based on {daily.length}-day average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">Budget Status</p>
              <p className="text-3xl font-bold text-white">${dailyBudget}/day</p>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${today.isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((today.cost / dailyBudget) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Trend */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Daily Costs (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={12}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#F97316" 
                      strokeWidth={2}
                      dot={{ fill: '#F97316' }}
                    />
                    {/* Budget line */}
                    <Line 
                      type="monotone" 
                      dataKey={() => dailyBudget} 
                      stroke="#EF4444" 
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-500">
                  No cost data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Project */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Cost by Project (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              {byProject.length > 0 ? (
                <div className="space-y-4">
                  {byProject.map((project) => (
                    <div key={project.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white">{project.name}</span>
                        <span className="text-sm font-medium text-white">
                          ${project.cost.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all"
                          style={{ width: `${project.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">
                        {(project.input / 1000).toFixed(0)}k in · {(project.output / 1000).toFixed(0)}k out · {project.percentage.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-zinc-500">
                  No project data for today
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {today.isOverBudget && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-white">Daily budget exceeded</p>
                <p className="text-sm text-zinc-400">
                  You&apos;re ${(today.cost - dailyBudget).toFixed(2)} over your ${dailyBudget} daily budget. 
                  Consider reducing usage or adjusting the budget.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
