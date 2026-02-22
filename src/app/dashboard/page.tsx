'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Session {
  key: string;
  kind: string;
  model: string;
  lastActivity: string;
  tokenCount: number;
  agent: string;
  channel: string;
}

interface StatusData {
  costs: {
    today: number;
    byProject: Record<string, number>;
    byAgent: Record<string, number>;
  };
  sessions: {
    total: number;
    active: number;
    list: any[];
  };
  system: {
    cpu: { usage: number };
    memory: { percentage: number; used: number; total: number };
    uptime: number;
  };
}

const COLORS = ['#F97316', '#3B82F6', '#22C55E', '#EAB308', '#EC4899', '#8B5CF6'];

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusRes, sessionsRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/sessions'),
        ]);
        
        const statusData = await statusRes.json();
        const sessionsData = await sessionsRes.json();
        
        if (statusData.ok) setStatus(statusData);
        if (sessionsData.ok) setSessions(sessionsData.sessions || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const projectData = status?.costs.byProject 
    ? Object.entries(status.costs.byProject).map(([name, value]) => ({
        name: name.slice(0, 10),
        value: Number(value.toFixed(2)),
      })).sort((a, b) => b.value - a.value).slice(0, 6)
    : [];

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="Real-time metrics and analytics" />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">Cost Today</p>
              <p className="text-3xl font-bold text-white mt-1">
                ${loading ? '...' : (status?.costs.today || 0).toFixed(2)}
              </p>
              {status && status.costs.today > 150 && (
                <Badge variant="destructive" className="mt-2">Above budget</Badge>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">Total Sessions</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : status?.sessions.total || 0}
              </p>
              <p className="text-xs text-green-500 mt-2">
                {status?.sessions.active || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">CPU Usage</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : `${status?.system.cpu.usage || 0}%`}
              </p>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${status?.system.cpu.usage || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500">Memory</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : `${status?.system.memory.percentage || 0}%`}
              </p>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${status?.system.memory.percentage || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost by Project */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Cost by Project</CardTitle>
            </CardHeader>
            <CardContent>
              {projectData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={projectData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a"
                      fontSize={12}
                    />
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
                    <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-zinc-500">
                  No cost data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessions Distribution */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Sessions by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        sessions.reduce((acc: Record<string, number>, s) => {
                          acc[s.channel] = (acc[s.channel] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {Object.keys(
                        sessions.reduce((acc: Record<string, number>, s) => {
                          acc[s.channel] = (acc[s.channel] || 0) + 1;
                          return acc;
                        }, {})
                      ).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-zinc-500">
                  No session data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.slice(0, 10).map((session, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm text-white font-medium truncate max-w-md">
                        {session.key}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.channel} · {session.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">
                      {session.tokenCount?.toLocaleString() || 0} tokens
                    </p>
                    <p className="text-xs text-zinc-500">
                      {session.lastActivity ? formatTime(session.lastActivity) : 'unknown'}
                    </p>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && !loading && (
                <p className="text-center text-zinc-500 py-8">No sessions found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
