'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { agents } from '@/lib/data/agents';

export default function AgentsPage() {
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
                      <p className="text-lg font-bold text-white">0</p>
                      <p className="text-xs text-zinc-500">Tasks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">0</p>
                      <p className="text-xs text-zinc-500">Tokens</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">$0</p>
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
