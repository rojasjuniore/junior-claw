'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Server, Database, Cpu, HardDrive, 
  RefreshCw, ExternalLink, FolderOpen
} from 'lucide-react';

interface SystemInfo {
  cpu: { usage: number; cores: number };
  memory: { total: number; used: number; percentage: number };
  uptime: number;
  platform: string;
  hostname: string;
}

export default function SettingsPage() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.ok) {
          setSystem(data.system);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Settings" 
        subtitle="Configure ClawHQ and view system info"
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* System Information */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                  <Cpu className="h-4 w-4" />
                  CPU
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : `${system?.cpu.usage}%`}
                </p>
                <p className="text-xs text-zinc-500">
                  {system?.cpu.cores} cores
                </p>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                  <HardDrive className="h-4 w-4" />
                  Memory
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : `${system?.memory.percentage}%`}
                </p>
                <p className="text-xs text-zinc-500">
                  {system && `${formatBytes(system.memory.used)} / ${formatBytes(system.memory.total)}`}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                  <Server className="h-4 w-4" />
                  Platform
                </div>
                <p className="text-2xl font-bold text-white capitalize">
                  {loading ? '...' : system?.platform}
                </p>
                <p className="text-xs text-zinc-500">
                  {system?.hostname}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                  <RefreshCw className="h-4 w-4" />
                  Uptime
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : formatUptime(system?.uptime || 0)}
                </p>
                <p className="text-xs text-zinc-500">
                  System uptime
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OpenClaw Configuration */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              OpenClaw Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Config Directory</label>
                <div className="flex items-center gap-2">
                  <Input 
                    value="~/.openclaw" 
                    readOnly 
                    className="bg-zinc-800 border-zinc-700 font-mono text-sm"
                  />
                  <Button variant="outline" size="icon">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Workspace Directory</label>
                <div className="flex items-center gap-2">
                  <Input 
                    value="~/.openclaw/workspace" 
                    readOnly 
                    className="bg-zinc-800 border-zinc-700 font-mono text-sm"
                  />
                  <Button variant="outline" size="icon">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                Gateway: Connected
              </Badge>
              <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                Version: 2026.2.22
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="https://docs.openclaw.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span className="text-white">Documentation</span>
                <ExternalLink className="h-4 w-4 text-zinc-500" />
              </a>
              <a 
                href="https://discord.com/invite/clawd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span className="text-white">Discord Community</span>
                <ExternalLink className="h-4 w-4 text-zinc-500" />
              </a>
              <a 
                href="https://github.com/openclaw/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span className="text-white">GitHub</span>
                <ExternalLink className="h-4 w-4 text-zinc-500" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🦞</div>
            <h3 className="text-xl font-bold text-white mb-2">Junior Claw</h3>
            <p className="text-zinc-500 mb-4">
              Mission Control — El cockpit del CEO y su squad
            </p>
            <p className="text-xs text-zinc-600">
              Built with Next.js 16, shadcn/ui, and 💜
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
