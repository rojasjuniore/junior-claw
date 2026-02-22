import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

// OpenClaw paths
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(os.homedir(), '.openclaw');
const CONFIG_PATH = path.join(OPENCLAW_DIR, 'openclaw.json');
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');
const SESSIONS_DIR = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions');
const SESSIONS_JSON = path.join(SESSIONS_DIR, 'sessions.json');

export interface OpenClawConfig {
  agents?: {
    list?: Array<{
      id: string;
      name?: string;
      workspace?: string;
      model?: {
        default?: string;
      };
    }>;
    defaults?: {
      model?: {
        default?: string;
      };
    };
  };
  channels?: Record<string, unknown>;
  crons?: Array<{
    id: string;
    name?: string;
    schedule: string;
    enabled?: boolean;
    prompt?: string;
  }>;
}

export interface Session {
  key: string;
  kind?: string;
  model?: string;
  lastActivity?: string;
  tokenCount?: number;
  contextSize?: number;
  cost?: number;
}

export async function getConfig(): Promise<OpenClawConfig | null> {
  try {
    if (!existsSync(CONFIG_PATH)) return null;
    const content = await readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading OpenClaw config:', error);
    return null;
  }
}

export async function getSessions(): Promise<Session[]> {
  try {
    if (!existsSync(SESSIONS_JSON)) return [];
    const content = await readFile(SESSIONS_JSON, 'utf-8');
    const data = JSON.parse(content);
    
    // Sessions are stored directly as object keys (not wrapped in "sessions")
    // Format: { "agent:main:telegram:direct:123": { sessionId, updatedAt, ... } }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]: [string, any]) => {
        // Calculate approximate cost from tokens
        const tokenCount = value.tokenCount || value.contextSize || 0;
        const cost = tokenCount * 0.00003; // Rough estimate
        
        return {
          key,
          kind: value.chatType || 'direct',
          model: value.model || 'claude-opus-4-5',
          lastActivity: value.updatedAt ? new Date(value.updatedAt).toISOString() : undefined,
          tokenCount: tokenCount,
          contextSize: value.contextSize,
          cost: cost,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error reading sessions:', error);
    return [];
  }
}

export async function getMemoryFiles(): Promise<string[]> {
  const memoryDir = path.join(WORKSPACE_DIR, 'memory');
  try {
    if (!existsSync(memoryDir)) return [];
    const { readdir } = await import('fs/promises');
    const files = await readdir(memoryDir);
    return files.filter(f => f.endsWith('.md'));
  } catch {
    return [];
  }
}

export async function readMemoryFile(filename: string): Promise<string | null> {
  const filePath = path.join(WORKSPACE_DIR, 'memory', filename);
  try {
    if (!existsSync(filePath)) return null;
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export async function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  // Calculate CPU usage (simplified)
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpus.length;

  return {
    cpu: {
      usage: Math.round(cpuUsage),
      cores: cpus.length,
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentage: Math.round((usedMem / totalMem) * 100),
    },
    uptime: os.uptime(),
    platform: os.platform(),
    hostname: os.hostname(),
  };
}

export function calculateCosts(sessions: Session[]): {
  today: number;
  byProject: Record<string, number>;
  byAgent: Record<string, number>;
} {
  const today = new Date().toISOString().split('T')[0];
  let todayTotal = 0;
  const byProject: Record<string, number> = {};
  const byAgent: Record<string, number> = {};

  for (const session of sessions) {
    if (!session.cost) continue;
    
    // Check if session is from today
    if (session.lastActivity?.startsWith(today)) {
      todayTotal += session.cost;
    }

    // Extract project from session key
    const keyParts = session.key.split(':');
    const project = keyParts[2] || 'general';
    byProject[project] = (byProject[project] || 0) + session.cost;

    // Agent is usually first part
    const agent = keyParts[1] || 'main';
    byAgent[agent] = (byAgent[agent] || 0) + session.cost;
  }

  return { today: todayTotal, byProject, byAgent };
}

export const paths = {
  OPENCLAW_DIR,
  CONFIG_PATH,
  WORKSPACE_DIR,
  SESSIONS_DIR,
  SESSIONS_JSON,
};
