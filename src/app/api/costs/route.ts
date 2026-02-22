import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const SESSIONS_DIR = join(homedir(), '.openclaw', 'agents', 'main', 'sessions');

// Proyectos conocidos y sus palabras clave
const PROJECTS: Record<string, string[]> = {
  'javapay': ['javapay', 'java pay', 'java-pay'],
  'clawstack': ['clawstack', 'claw stack', 'claw-stack'],
  'brandcast': ['brandcast', 'brand cast', 'agent q', 'agent-q'],
  'clawhq': ['clawhq', 'claw hq', 'claw-hq', 'mission control dashboard'],
  'influstar': ['influstar', 'lukystar', 'front_app'],
  'mission-control': ['mission-control', 'mission control', 'convex'],
  'dex-screener': ['dex-screener', 'dex screener', 'dexscreener'],
  'urbanpass': ['urbanpass', 'urban pass', 'urban-pass'],
  'openclaw': ['openclaw', 'open claw', 'gateway', 'skill'],
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

interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}

interface DailyCost {
  date: string;
  cost: number;
  input: number;
  output: number;
}

interface ProjectCost {
  name: string;
  cost: number;
  percentage: number;
  input: number;
  output: number;
}

async function getSessionFiles(): Promise<string[]> {
  try {
    const files = await readdir(SESSIONS_DIR);
    return files
      .filter(f => f.endsWith('.jsonl'))
      .map(f => join(SESSIONS_DIR, f));
  } catch {
    return [];
  }
}

function parseDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function calculateCosts(): Promise<{
  today: { cost: number; input: number; output: number };
  yesterday: { cost: number; input: number; output: number };
  daily: DailyCost[];
  byProject: ProjectCost[];
}> {
  const files = await getSessionFiles();
  const today = parseDate(new Date());
  const yesterday = parseDate(new Date(Date.now() - 86400000));
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  
  const dailyMap: Record<string, { cost: number; input: number; output: number }> = {};
  const projectMap: Record<string, { cost: number; input: number; output: number }> = {};
  
  for (const file of files) {
    try {
      // Skip files not modified in last 7 days (optimization)
      const fileStat = await stat(file);
      if (fileStat.mtime < sevenDaysAgo) continue;
      
      const content = await readFile(file, 'utf-8');
      const lines = content.trim().split('\n');
      
      let currentProject = 'general';
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          
          // Usar timestamp de la entrada, no del archivo
          const entryDate = entry.timestamp 
            ? parseDate(new Date(entry.timestamp))
            : null;
          
          if (!entryDate) continue;
          
          // Solo últimos 7 días
          const entryTime = new Date(entry.timestamp).getTime();
          if (entryTime < sevenDaysAgo.getTime()) continue;
          
          // Detectar proyecto del mensaje (puede estar en content o message.content)
          let msgText = '';
          const content = entry.content || entry.message?.content;
          if (content && typeof content === 'string') {
            msgText = content;
          } else if (content && Array.isArray(content)) {
            msgText = content.map((c: any) => c.text || c.content || '').join(' ');
          }
          
          const detected = detectProject(msgText);
          if (detected !== 'general') currentProject = detected;
          
          // Sumar uso (puede estar en entry.usage o entry.message.usage)
          const usage = entry.usage || entry.message?.usage;
          if (usage?.cost?.total) {
            const u = usage;
            const cost = u.cost.total || 0;
            const input = u.input || 0;
            const output = u.output || 0;
            
            // Por día (usando fecha de la entrada)
            if (!dailyMap[entryDate]) {
              dailyMap[entryDate] = { cost: 0, input: 0, output: 0 };
            }
            dailyMap[entryDate].cost += cost;
            dailyMap[entryDate].input += input;
            dailyMap[entryDate].output += output;
            
            // Por proyecto (solo hoy)
            if (entryDate === today) {
              if (!projectMap[currentProject]) {
                projectMap[currentProject] = { cost: 0, input: 0, output: 0 };
              }
              projectMap[currentProject].cost += cost;
              projectMap[currentProject].input += input;
              projectMap[currentProject].output += output;
            }
          }
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // Skip unreadable files
    }
  }
  
  // Formatear daily (sort by ISO date, then format for display)
  // Note: Use UTC to avoid timezone issues (date is already in YYYY-MM-DD format)
  const daily: DailyCost[] = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort by ISO date first
    .slice(-7)
    .map(([date, data]) => {
      // Parse date parts directly to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        date: `${months[month - 1]} ${day}`,
        ...data,
      };
    });
  
  // Calcular total para porcentajes
  const totalTodayCost = Object.values(projectMap).reduce((acc, p) => acc + p.cost, 0);
  
  // Formatear por proyecto
  const byProject: ProjectCost[] = Object.entries(projectMap)
    .map(([name, data]) => ({
      name,
      ...data,
      percentage: totalTodayCost > 0 ? (data.cost / totalTodayCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);
  
  return {
    today: dailyMap[today] || { cost: 0, input: 0, output: 0 },
    yesterday: dailyMap[yesterday] || { cost: 0, input: 0, output: 0 },
    daily,
    byProject,
  };
}

export async function GET() {
  try {
    const costs = await calculateCosts();
    
    const todayCost = costs.today.cost;
    const yesterdayCost = costs.yesterday.cost;
    const weekTotal = costs.daily.reduce((acc, d) => acc + d.cost, 0);
    const dailyBudget = 150;
    
    return NextResponse.json({
      ok: true,
      today: {
        cost: todayCost,
        input: costs.today.input,
        output: costs.today.output,
        percentChange: yesterdayCost > 0 
          ? ((todayCost - yesterdayCost) / yesterdayCost * 100).toFixed(1)
          : 0,
        isOverBudget: todayCost > dailyBudget,
      },
      week: {
        total: weekTotal,
        average: weekTotal / Math.max(costs.daily.length, 1),
      },
      monthlyProjection: (weekTotal / Math.max(costs.daily.length, 1)) * 30,
      dailyBudget,
      daily: costs.daily,
      byProject: costs.byProject,
    });
  } catch (error) {
    console.error('Failed to calculate costs:', error);
    return NextResponse.json({ ok: false, error: 'Failed to calculate costs' }, { status: 500 });
  }
}
