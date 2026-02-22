'use client';

import { useEffect, useState } from 'react';
import { agents, Agent } from '@/lib/data/agents';
import { AgentDesk } from './AgentDesk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Zap, Clock, AlertTriangle, Cpu, HardDrive } from 'lucide-react';

interface StatusData {
  ok: boolean;
  agents: { total: number; active: number };
  sessions: { total: number; active: number };
  costs: { today: number };
  crons: { total: number; active: number };
  decisions: { pending: number };
  system: {
    cpu: { usage: number; cores: number };
    memory: { percentage: number; used: number; total: number };
  };
}

interface AgentStatus {
  status: 'active' | 'idle' | 'thinking' | 'offline';
  task?: string;
}

export function OfficeView() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [agentStatus, setAgentStatus] = useState<Record<string, AgentStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.ok) {
          setStatus(data);
          
          // Update agent status based on active sessions
          const newStatus: Record<string, AgentStatus> = {};
          agents.forEach(agent => {
            newStatus[agent.id] = { status: 'idle' };
          });
          
          // Mark Junior Claw as active if there are active sessions
          if (data.sessions.active > 0) {
            newStatus['junior-claw'] = { 
              status: 'active', 
              task: `Managing ${data.sessions.active} active sessions` 
            };
          }
          
          // Check sessions to see which agents are active
          data.sessions.list?.forEach((session: any) => {
            const keyParts = session.key.split(':');
            if (keyParts.includes('cron')) {
              newStatus['sentinel'] = { status: 'active', task: 'Running scheduled tasks' };
            }
          });
          
          setAgentStatus(newStatus);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    // Refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Zap className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : status?.sessions.active || 0}
              </p>
              <p className="text-xs text-zinc-500">Active Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatCost(status?.costs.today || 0)}
              </p>
              <p className="text-xs text-zinc-500">Cost Today</p>
            </div>
            {status && status.costs.today > 150 && (
              <Badge variant="destructive" className="ml-auto text-[10px]">
                HIGH
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : status?.crons.active || 0}
              </p>
              <p className="text-xs text-zinc-500">Active Crons</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : status?.decisions?.pending || 0}
              </p>
              <p className="text-xs text-zinc-500">Decisions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Cpu className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : `${status?.system.cpu.usage || 0}%`}
              </p>
              <p className="text-xs text-zinc-500">CPU</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-cyan-500/10">
              <HardDrive className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : `${status?.system.memory.percentage || 0}%`}
              </p>
              <p className="text-xs text-zinc-500">Memory</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Office Floor */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <span>🏢</span> Office Floor
              {!loading && status && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {status.sessions.total} total sessions
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-500" /> Idle
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-500" /> Thinking
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Office Grid */}
          <div className="relative">
            {/* CEO Section */}
            <div className="mb-8">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Executive</div>
              <div className="flex gap-4">
                {agents.filter(a => a.department === 'executive').map(agent => (
                  <AgentDesk
                    key={agent.id}
                    agent={agent}
                    status={agentStatus[agent.id]?.status || 'idle'}
                    currentTask={agentStatus[agent.id]?.task}
                  />
                ))}
              </div>
            </div>

            {/* Main Floor */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Engineering */}
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Engineering</div>
                <div className="grid grid-cols-2 gap-3">
                  {agents.filter(a => a.department === 'engineering').map(agent => (
                    <AgentDesk
                      key={agent.id}
                      agent={agent}
                      status={agentStatus[agent.id]?.status || 'idle'}
                      currentTask={agentStatus[agent.id]?.task}
                    />
                  ))}
                </div>
              </div>

              {/* Operations */}
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Operations</div>
                <div className="grid grid-cols-2 gap-3">
                  {agents.filter(a => a.department === 'operations').map(agent => (
                    <AgentDesk
                      key={agent.id}
                      agent={agent}
                      status={agentStatus[agent.id]?.status || 'idle'}
                      currentTask={agentStatus[agent.id]?.task}
                    />
                  ))}
                </div>
              </div>

              {/* Business */}
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Business</div>
                <div className="grid grid-cols-2 gap-3">
                  {agents.filter(a => a.department === 'business').map(agent => (
                    <AgentDesk
                      key={agent.id}
                      agent={agent}
                      status={agentStatus[agent.id]?.status || 'idle'}
                      currentTask={agentStatus[agent.id]?.task}
                    />
                  ))}
                </div>
              </div>

              {/* Support */}
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Support</div>
                <div className="grid grid-cols-2 gap-3">
                  {agents.filter(a => a.department === 'support').map(agent => (
                    <AgentDesk
                      key={agent.id}
                      agent={agent}
                      status={agentStatus[agent.id]?.status || 'idle'}
                      currentTask={agentStatus[agent.id]?.task}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
