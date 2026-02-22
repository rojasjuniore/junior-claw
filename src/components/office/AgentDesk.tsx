'use client';

import { useState } from 'react';
import { Agent } from '@/lib/data/agents';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AgentDeskProps {
  agent: Agent;
  status?: 'active' | 'idle' | 'thinking' | 'offline';
  currentTask?: string;
}

export function AgentDesk({ agent, status = 'idle', currentTask }: AgentDeskProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-zinc-500',
    thinking: 'bg-yellow-500',
    offline: 'bg-red-500',
  };

  const statusAnimations = {
    active: 'animate-pulse',
    thinking: 'animate-bounce',
    idle: '',
    offline: '',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 cursor-pointer',
            'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600',
            isHovered && 'scale-105 bg-zinc-800/50',
            status === 'active' && 'ring-2 ring-green-500/30'
          )}
          style={{
            boxShadow: isHovered ? `0 0 20px ${agent.color}30` : 'none',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Status indicator */}
          <div className={cn(
            'absolute top-2 right-2 h-3 w-3 rounded-full',
            statusColors[status],
            statusAnimations[status]
          )} />

          {/* Agent emoji/avatar */}
          <div 
            className={cn(
              'text-4xl mb-2 transition-transform duration-300',
              isHovered && 'scale-110',
              status === 'thinking' && 'animate-bounce'
            )}
          >
            {agent.emoji}
          </div>

          {/* Desk */}
          <div 
            className="w-16 h-2 rounded-sm mb-2"
            style={{ backgroundColor: agent.color }}
          />

          {/* Name */}
          <span className="text-xs font-medium text-white truncate max-w-full">
            {agent.name}
          </span>

          {/* Role */}
          <span className="text-[10px] text-zinc-500 truncate max-w-full">
            {agent.role}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-zinc-900 border-zinc-700">
        <div className="text-sm">
          <div className="font-medium text-white flex items-center gap-2">
            {agent.emoji} {agent.name}
          </div>
          <div className="text-zinc-400 text-xs">{agent.role}</div>
          {currentTask && (
            <div className="mt-2 text-xs">
              <span className="text-zinc-500">Working on: </span>
              <span className="text-orange-400">{currentTask}</span>
            </div>
          )}
          <div className="mt-1 flex items-center gap-1">
            <div className={cn('h-2 w-2 rounded-full', statusColors[status])} />
            <span className="text-xs text-zinc-500 capitalize">{status}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
