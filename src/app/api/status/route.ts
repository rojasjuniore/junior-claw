import { NextResponse } from 'next/server';
import { getConfig, getSessions, getSystemMetrics, calculateCosts, paths } from '@/lib/openclaw';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

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
    const costs = calculateCosts(sessions);
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
