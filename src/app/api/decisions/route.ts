import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(os.homedir(), '.openclaw', 'workspace', 'clawhq', 'data');
const DECISIONS_FILE = path.join(DATA_DIR, 'decisions.json');

interface Decision {
  id: string;
  agent: string;
  agentEmoji: string;
  type: 'approval' | 'review' | 'alert' | 'info';
  title: string;
  description: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
  resolvedAt?: string;
  context?: Record<string, any>;
}

interface DecisionsData {
  decisions: Decision[];
  lastUpdated: string;
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function readDecisions(): Promise<DecisionsData> {
  await ensureDataDir();
  
  if (!existsSync(DECISIONS_FILE)) {
    // Return initial decisions
    return {
      decisions: [
        {
          id: 'dec-1',
          agent: 'Stack',
          agentEmoji: '🔌',
          type: 'approval',
          title: 'Deploy influstar-api to production',
          description: 'Migrations ready, all tests passing. Ready to deploy to Railway.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          priority: 'high',
          status: 'pending',
        },
        {
          id: 'dec-2',
          agent: 'Pixel',
          agentEmoji: '🎨',
          type: 'review',
          title: 'Landing page redesign complete',
          description: '3 design variants ready for review. Mobile-first approach with dark mode support.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          priority: 'medium',
          status: 'pending',
        },
        {
          id: 'dec-3',
          agent: 'Ledger',
          agentEmoji: '💰',
          type: 'alert',
          title: 'Cost alert: Daily budget exceeded',
          description: 'Current spend: $168.52. Daily budget: $150. Projected monthly: $4,200.',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          priority: 'high',
          status: 'pending',
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
  
  const content = await readFile(DECISIONS_FILE, 'utf-8');
  return JSON.parse(content);
}

async function writeDecisions(data: DecisionsData) {
  await ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  await writeFile(DECISIONS_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await readDecisions();
    const pending = data.decisions.filter(d => d.status === 'pending');
    const resolved = data.decisions.filter(d => d.status !== 'pending');
    
    return NextResponse.json({
      ok: true,
      pendingCount: pending.length,
      pending,
      resolved: resolved.slice(0, 20), // Last 20 resolved
      lastUpdated: data.lastUpdated,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const decision: Decision = await request.json();
    
    // Validate required fields
    if (!decision.agent || !decision.title) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const data = await readDecisions();
    
    // Generate ID if not provided
    if (!decision.id) {
      decision.id = `dec-${Date.now()}`;
    }
    
    // Set defaults
    decision.timestamp = decision.timestamp || new Date().toISOString();
    decision.status = decision.status || 'pending';
    decision.priority = decision.priority || 'medium';
    decision.type = decision.type || 'info';
    
    data.decisions.unshift(decision);
    await writeDecisions(data);
    
    return NextResponse.json({ ok: true, decision });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, comment } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 });
    }
    
    const data = await readDecisions();
    const decision = data.decisions.find(d => d.id === id);
    
    if (!decision) {
      return NextResponse.json({ ok: false, error: 'Decision not found' }, { status: 404 });
    }
    
    decision.status = status;
    decision.resolvedAt = new Date().toISOString();
    if (comment) {
      decision.context = { ...decision.context, comment };
    }
    
    await writeDecisions(data);
    
    return NextResponse.json({ ok: true, decision });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
