import { NextResponse } from 'next/server';
import { getConfig, getSessions, getSystemMetrics, paths } from '@/lib/openclaw';
import { existsSync } from 'fs';
import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import os from 'os';

const SESSIONS_DIR = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions');

// Proyectos conocidos
const PROJECTS: Record<string, string[]> = {
  'javapay': ['javapay'],
  'clawstack': ['clawstack'],
  'brandcast': ['brandcast', 'agent q'],
  'clawhq': ['clawhq', 'claw hq'],
  'influstar': ['influstar', 'lukystar'],
  'openclaw': ['openclaw', 'gateway', 'skill'],
};

function detectProject(text: string): string {
  if (!text) return 'general';
  const lower = text.toLowerCase();
  for (const [project, keywords] of Object.entries(PROJECTS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return project;
    }
  }
  return 'general';
}

async function calculateRealCosts(): Promise<{
  today: number;
  byProject: Record<string, number>;
  byAgent: Record<string, number>;
}> {
  const today = new Date().toISOString().split('T')[0];
  let todayTotal = 0;
  const byProject: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  
  try {
    const files = await readdir(SESSIONS_DIR);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    
    // Only check files modified in last 24 hours
    const oneDayAgo = new Date(Date.now() - 86400000);
    
    // Get file stats and sort by mtime (most recent first)
    const fileStats = await Promise.all(
      jsonlFiles.map(async f => ({
        name: f,
        mtime: (await stat(path.join(SESSIONS_DIR, f))).mtime,
      }))
    );
    const recentFiles = fileStats
      .filter(f => f.mtime >= oneDayAgo)
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, 50) // Limit for performance
      .map(f => f.name);
    
    for (const file of recentFiles) {
      const filePath = path.join(SESSIONS_DIR, file);
      
      const content = await readFile(filePath, 'utf-8');
      let currentProject = 'general';
      
      for (const line of content.split('\n')) {
        try {
          const entry = JSON.parse(line);
          const usage = entry.usage || entry.message?.usage;
          const timestamp = entry.timestamp;
          
          if (!usage?.cost?.total || !timestamp?.startsWith(today)) continue;
          
          // Detect project from content
          const msgContent = entry.content || entry.message?.content;
          let msgText = '';
          if (typeof msgContent === 'string') msgText = msgContent;
          else if (Array.isArray(msgContent)) {
            msgText = msgContent.map((c: any) => c.text || '').join(' ');
          }
          const detected = detectProject(msgText);
          if (detected !== 'general') currentProject = detected;
          
          const cost = usage.cost.total;
          todayTotal += cost;
          byProject[currentProject] = (byProject[currentProject] || 0) + cost;
          byAgent['main'] = (byAgent['main'] || 0) + cost;
        } catch {}
      }
    }
  } catch {}
  
  return { today: todayTotal, byProject, byAgent };
}

async function getPendingDecisionsCount(): Promise<number> {
  try {
    const decisionsFile = path.join(os.homedir(), '.openclaw', 'workspace', 'clawhq', 'data', 'decisions.json');
    if (!existsSync(decisionsFile)) return 3; // Default mock count
    const content = await readFile(decisionsFile, 'utf-8');
    const data = JSON.parse(content);
    return data.decisions?.filter((d: any) => d.status === 'pending').length || 0;
  } catch {
    return 3; // Default
  }
}

export async function GET() {
  try {
    const config = await getConfig();
    const sessions = await getSessions();
    const system = await getSystemMetrics();
    const costs = await calculateRealCosts();
    const pendingDecisions = await getPendingDecisionsCount();

    // Count active sessions (activity in last 5 minutes)
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const activeSessions = sessions.filter(s => {
      if (!s.lastActivity) return false;
      return new Date(s.lastActivity).getTime() > fiveMinAgo;
    });

    // Get crons from config
    const crons = config?.crons || [];
    const activeCrons = crons.filter(c => c.enabled !== false);

    return NextResponse.json({
      ok: true,
      gateway: {
        connected: existsSync(paths.CONFIG_PATH),
        version: '2026.2.22', // TODO: read from actual version
      },
      agents: {
        total: config?.agents?.list?.length || 1,
        active: activeSessions.length,
      },
      sessions: {
        total: sessions.length,
        active: activeSessions.length,
        list: activeSessions.slice(0, 10).map(s => ({
          key: s.key,
          model: s.model,
          lastActivity: s.lastActivity,
          tokens: s.tokenCount,
        })),
      },
      costs: {
        today: costs.today,
        byProject: costs.byProject,
        byAgent: costs.byAgent,
      },
      crons: {
        total: crons.length,
        active: activeCrons.length,
      },
      decisions: {
        pending: pendingDecisions,
      },
      system,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
