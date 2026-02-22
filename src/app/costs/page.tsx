'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

// Mock data - will be replaced with real data
const dailyCosts = [
  { date: 'Feb 15', cost: 89.50 },
  { date: 'Feb 16', cost: 112.30 },
  { date: 'Feb 17', cost: 145.20 },
  { date: 'Feb 18', cost: 98.40 },
  { date: 'Feb 19', cost: 167.80 },
  { date: 'Feb 20', cost: 113.51 },
  { date: 'Feb 21', cost: 168.52 },
];

const projectCosts = [
  { name: 'javapay', cost: 109.58, percentage: 65 },
  { name: 'general', cost: 57.68, percentage: 34 },
  { name: 'clawstack', cost: 0.69, percentage: 0.4 },
  { name: 'mission-control', cost: 0.33, percentage: 0.2 },
  { name: 'brandcast', cost: 0.24, percentage: 0.1 },
];

export default function CostsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.ok) {
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const todayCost = 168.52;
  const yesterdayCost = 113.51;
  const weekTotal = dailyCosts.reduce((acc, d) => acc + d.cost, 0);
  const dailyBudget = 150;
  const monthlyProjection = (weekTotal / 7) * 30;

  const percentChange = ((todayCost - yesterdayCost) / yesterdayCost * 100).toFixed(1);
  const isOverBudget = todayCost > dailyBudget;

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Cost Center" 
        subtitle="Track and analyze AI spending"
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`border-zinc-800 ${isOverBudget ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Today</p>
                  <p className="text-3xl font-bold text-white">${todayCost.toFixed(2)}</p>
                </div>
                {isOverBudget && (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {Number(percentChange) > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className={Number(percentChange) > 0 ? 'text-red-500' : 'text-green-500'}>
                  {percentChange}% vs yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">This Week</p>
              <p className="text-3xl font-bold text-white">${weekTotal.toFixed(2)}</p>
              <p className="text-sm text-zinc-500 mt-2">
                Avg: ${(weekTotal / 7).toFixed(2)}/day
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">Monthly Projection</p>
              <p className="text-3xl font-bold text-white">${monthlyProjection.toFixed(0)}</p>
              <p className="text-sm text-zinc-500 mt-2">
                Based on 7-day average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">Budget Status</p>
              <p className="text-3xl font-bold text-white">${dailyBudget}/day</p>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((todayCost / dailyBudget) * 100, 100)}%` }}
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyCosts}>
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
            </CardContent>
          </Card>

          {/* By Project */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Cost by Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectCosts.map((project, i) => (
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {isOverBudget && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-white">Daily budget exceeded</p>
                <p className="text-sm text-zinc-400">
                  You're ${(todayCost - dailyBudget).toFixed(2)} over your $150 daily budget. 
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
