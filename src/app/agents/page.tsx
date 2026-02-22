'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { agents } from '@/lib/data/agents';

interface AgentStats {
  sessions: number;
  tokens: number;
  cost: number;
}

export default function AgentsPage() {
  const [stats, setStats] = useState<Record<string, AgentStats>>({});
  
  useEffect(() => {
    async function fetchStats() {
      try {
        const [sessionsRes, costsRes] = await Promise.all([
          fetch('/api/sessions'),
          fetch('/api/costs'),
        ]);
        const sessionsData = await sessionsRes.json();
        const costsData = await costsRes.json();
        
        // Aggregate stats by agent
        const agentStats: Record<string, AgentStats> = {};
        
        // Initialize all agents
        agents.forEach(a => {
          agentStats[a.id] = { sessions: 0, tokens: 0, cost: 0 };
        });
        
        // Count sessions per agent
        if (sessionsData.sessions) {
          sessionsData.sessions.forEach((s: any) => {
            // Sessions belong to main agent for now
            if (agentStats['junior-claw']) {
              agentStats['junior-claw'].sessions++;
              agentStats['junior-claw'].tokens += s.tokenCount || 0;
            }
          });
        }
        
        // Costs go to Junior Claw (main agent)
        if (costsData.today?.cost && agentStats['junior-claw']) {
          agentStats['junior-claw'].cost = costsData.today.cost;
        }
        
        setStats(agentStats);
      } catch (e) {
        console.error('Failed to fetch agent stats:', e);
      }
    }
    fetchStats();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Agents" 
        subtitle={`${agents.length} agents in your squad`}
      />
      
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <Card 
              key={agent.id}
              className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="text-4xl p-3 rounded-xl"
                    style={{ backgroundColor: `${agent.color}20` }}
                  >
                    {agent.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-sm text-zinc-500">{agent.role}</p>
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs"
                      style={{ 
                        borderColor: `${agent.color}50`,
                        color: agent.color 
                      }}
                    >
                      {agent.department}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">
                        {stats[agent.id]?.sessions || 0}
                      </p>
                      <p className="text-xs text-zinc-500">Sessions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {((stats[agent.id]?.tokens || 0) / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-zinc-500">Tokens</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        ${(stats[agent.id]?.cost || 0).toFixed(0)}
                      </p>
                      <p className="text-xs text-zinc-500">Cost</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
