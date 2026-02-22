'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface Cron {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  status: string;
  lastRun?: string;
  nextRun?: string;
  target?: string;
  agent?: string;
}

export default function CronsPage() {
  const [crons, setCrons] = useState<Cron[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  async function fetchCrons() {
    try {
      const res = await fetch('/api/crons');
      const data = await res.json();
      if (data.ok) {
        setCrons(data.crons);
      }
    } catch (error) {
      console.error('Failed to fetch crons:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCrons();
    const interval = setInterval(fetchCrons, 30000);
    return () => clearInterval(interval);
  }, []);

  const runCron = async (id: string) => {
    setRunning(id);
    try {
      const res = await fetch('/api/crons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', cronId: id }),
      });
      const data = await res.json();
      if (data.ok) {
        // Refresh crons after running
        setTimeout(fetchCrons, 2000);
      }
    } catch (error) {
      console.error('Failed to run cron:', error);
    } finally {
      setRunning(null);
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return 'Never';
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60000);
    const isFuture = diff < 0;
    
    if (mins < 1) return isFuture ? 'in < 1m' : 'just now';
    if (mins < 60) return isFuture ? `in ${mins}m` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isFuture ? `in ${hours}h` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isFuture ? `in ${days}d` : `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'running': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'idle': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30';
    }
  };

  const activeCrons = crons.filter(c => c.enabled);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Cron Jobs" 
        subtitle={`${activeCrons.length} active jobs`}
      />
      
      <div className="flex-1 p-6 space-y-4">
        {/* Refresh button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setLoading(true); fetchCrons(); }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading && crons.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : crons.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
              <h3 className="text-lg font-semibold text-white mb-2">No cron jobs found</h3>
              <p className="text-zinc-500">Cron jobs will appear here when configured in OpenClaw.</p>
            </CardContent>
          </Card>
        ) : (
          crons.map((cron) => (
            <Card 
              key={cron.id}
              className={`bg-zinc-900/50 border-zinc-800 transition-all ${
                !cron.enabled ? 'opacity-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`p-2 rounded-lg ${
                    cron.status === 'ok' ? 'bg-green-500/10' : 
                    cron.status === 'error' ? 'bg-red-500/10' : 'bg-zinc-800'
                  }`}>
                    {cron.status === 'ok' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : cron.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-white">{cron.name}</h3>
                      <Badge variant="outline" className={getStatusColor(cron.status)}>
                        {cron.status}
                      </Badge>
                      {cron.target && (
                        <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700">
                          {cron.target}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1 font-mono">
                      {cron.schedule}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span>Last: {formatTime(cron.lastRun)}</span>
                      <span>Next: {formatTime(cron.nextRun)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runCron(cron.id)}
                    disabled={running === cron.id || !cron.enabled}
                  >
                    {running === cron.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="ml-2">Run Now</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
