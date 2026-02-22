import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const WORKSPACE_DIR = process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

async function listDirectory(dirPath: string): Promise<FileInfo[]> {
  if (!existsSync(dirPath)) return [];
  
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: FileInfo[] = [];
  
  for (const entry of entries) {
    // Skip hidden files and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(WORKSPACE_DIR, fullPath);
    
    try {
      const stats = await stat(fullPath);
      files.push({
        name: entry.name,
        path: relativePath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime.toISOString(),
      });
    } catch {
      // Skip files we can't stat
    }
  }
  
  // Sort: directories first, then alphabetically
  return files.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path') || '';
  const action = searchParams.get('action') || 'list';
  
  const fullPath = path.join(WORKSPACE_DIR, filePath);
  
  // Security: ensure path is within workspace
  if (!fullPath.startsWith(WORKSPACE_DIR)) {
    return NextResponse.json({ ok: false, error: 'Invalid path' }, { status: 400 });
  }
  
  try {
    if (action === 'read') {
      // Read file content
      if (!existsSync(fullPath)) {
        return NextResponse.json({ ok: false, error: 'File not found' }, { status: 404 });
      }
      
      const content = await readFile(fullPath, 'utf-8');
      const stats = await stat(fullPath);
      
      return NextResponse.json({
        ok: true,
        file: {
          path: filePath,
          name: path.basename(filePath),
          content,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        },
      });
    } else {
      // List directory
      const targetPath = filePath ? fullPath : WORKSPACE_DIR;
      const files = await listDirectory(targetPath);
      
      // Add key workspace files at root
      const keyFiles = ['MEMORY.md', 'AGENTS.md', 'TOOLS.md', 'SOUL.md', 'USER.md'];
      const highlighted = filePath === '' 
        ? files.filter(f => keyFiles.includes(f.name))
        : [];
      
      return NextResponse.json({
        ok: true,
        path: filePath || '/',
        files,
        highlighted: highlighted.map(f => f.name),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
