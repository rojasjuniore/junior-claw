'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  LayoutDashboard, 
  Inbox, 
  Clock, 
  Brain,
  Users,
  DollarSign,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';

interface StatusData {
  ok: boolean;
  gateway: { connected: boolean };
  decisions: { pending: number };
  crons: { active: number };
  sessions: { active: number };
}

export function Sidebar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.ok) {
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { name: 'Office', href: '/', icon: Building2 },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { 
      name: 'Decisions', 
      href: '/decisions', 
      icon: Inbox, 
      badge: status?.decisions.pending || 0 
    },
    { 
      name: 'Crons', 
      href: '/crons', 
      icon: Clock,
      badge: status?.crons.active || 0,
      badgeVariant: 'muted' as const
    },
    { name: 'Memory', href: '/memory', icon: Brain },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Costs', href: '/costs', icon: DollarSign },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-zinc-800">
        <span className="text-2xl">🦞</span>
        <span className="text-xl font-bold text-white">Junior Claw</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs',
                  item.badgeVariant === 'muted' 
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-orange-500 text-white'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <div className="mt-4 px-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            {status?.gateway.connected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-500">Gateway connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-500">Gateway disconnected</span>
              </>
            )}
          </div>
          {status?.sessions.active !== undefined && (
            <div className="mt-1 text-zinc-500">
              {status.sessions.active} active sessions
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
