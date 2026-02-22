import { NextResponse } from 'next/server';
import { getSessions } from '@/lib/openclaw';

export async function GET() {
  try {
    const sessions = await getSessions();
    
    // Sort by last activity
    const sorted = sessions.sort((a, b) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      ok: true,
      count: sessions.length,
      sessions: sorted.map(s => ({
        key: s.key,
        kind: s.kind,
        model: s.model,
        lastActivity: s.lastActivity,
        tokenCount: s.tokenCount,
        contextSize: s.contextSize,
        cost: s.cost,
        // Parse key parts
        agent: s.key.split(':')[1] || 'main',
        channel: s.key.split(':')[2] || 'direct',
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
