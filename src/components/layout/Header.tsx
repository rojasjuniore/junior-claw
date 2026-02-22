'use client';

import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [pendingDecisions, setPendingDecisions] = useState(0);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.ok && data.decisions) {
          setPendingDecisions(data.decisions.pending);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-zinc-400">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search..."
            className="w-64 bg-zinc-900 border-zinc-800 pl-9 text-sm"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-zinc-400" />
          {pendingDecisions > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-orange-500 text-[10px]">
              {pendingDecisions}
            </Badge>
          )}
        </Button>

        {/* User */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="text-sm font-medium text-white">Junior</span>
        </div>
      </div>
    </header>
  );
}
