import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  status: string;
  lastRun?: string;
  nextRun?: string;
  target?: string;
  agent?: string;
}

function parseRelativeTime(str: string): string | undefined {
  if (!str || str === '-') return undefined;
  
  // Parse "3m ago", "5h ago", etc to ISO date
  const match = str.match(/^(\d+)([mhd])\s+ago$/);
  if (match) {
    const [, num, unit] = match;
    const ms = parseInt(num) * (unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000);
    return new Date(Date.now() - ms).toISOString();
  }
  
  // Parse "in 2m", "in 5h", etc to ISO date
  const futureMatch = str.match(/^in\s+(\d+)([mhd])$/);
  if (futureMatch) {
    const [, num, unit] = futureMatch;
    const ms = parseInt(num) * (unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000);
    return new Date(Date.now() + ms).toISOString();
  }
  
  return undefined;
}

export async function GET() {
  try {
    // Use openclaw CLI to get cron list
    const { stdout } = await execAsync('openclaw cron list 2>&1');
    
    const crons: CronJob[] = [];
    const lines = stdout.split('\n');
    
    // Find the header line and parse data after it
    let dataStarted = false;
    let headerPositions: number[] = [];
    
    for (const line of lines) {
      // Skip empty lines and header decorations
      if (!line.trim() || line.includes('─') || line.includes('│') || line.includes('◇') || line.includes('Doctor')) {
        continue;
      }
      
      // Check for header row
      if (line.includes('ID') && line.includes('Name') && line.includes('Schedule')) {
        dataStarted = true;
        // Get column positions from header
        headerPositions = [
          line.indexOf('ID'),
          line.indexOf('Name'),
          line.indexOf('Schedule'),
          line.indexOf('Next'),
          line.indexOf('Last'),
          line.indexOf('Status'),
          line.indexOf('Target'),
          line.indexOf('Agent'),
        ].filter(p => p >= 0);
        continue;
      }
      
      if (!dataStarted) continue;
      
      // Parse using UUID pattern - ID is first column and is a UUID
      const uuidMatch = line.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+(.+)/i);
      
      if (uuidMatch) {
        const id = uuidMatch[1];
        const rest = uuidMatch[2];
        
        // Split rest by multiple spaces
        const parts = rest.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
        
        if (parts.length >= 4) {
          const [name, schedule, nextRun, lastRun, status = 'ok', target = 'main', agent = 'main'] = parts;
          
          crons.push({
            id,
            name,
            schedule,
            enabled: status !== 'disabled',
            status: status || 'ok',
            lastRun: parseRelativeTime(lastRun),
            nextRun: parseRelativeTime(nextRun),
            target,
            agent,
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      count: crons.length,
      active: crons.filter(c => c.enabled).length,
      crons,
    });
  } catch (error) {
    console.error('Cron API error:', error);
    return NextResponse.json({
      ok: false,
      count: 0,
      crons: [],
      error: String(error),
    });
  }
}

export async function POST(request: Request) {
  try {
    const { action, cronId } = await request.json();
    
    if (action === 'run' && cronId) {
      // Trigger cron manually
      const { stdout, stderr } = await execAsync(`openclaw cron run ${cronId} 2>&1`);
      return NextResponse.json({
        ok: true,
        message: 'Cron triggered',
        output: stdout || stderr,
      });
    }
    
    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
