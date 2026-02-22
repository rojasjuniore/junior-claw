'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, FileText, ChevronRight, ArrowLeft, 
  RefreshCw, Home, Edit, Save, X 
} from 'lucide-react';

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

interface FileContent {
  path: string;
  name: string;
  content: string;
  size: number;
  modified: string;
}

export default function MemoryPage() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath]);

  async function fetchDirectory(path: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.ok) {
        setFiles(data.files);
        setHighlighted(data.highlighted || []);
      }
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function openFile(filePath: string) {
    try {
      const res = await fetch(`/api/memory?path=${encodeURIComponent(filePath)}&action=read`);
      const data = await res.json();
      if (data.ok) {
        setSelectedFile(data.file);
        setEditContent(data.file.content);
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  }

  function handleFileClick(file: FileInfo) {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
      setSelectedFile(null);
    } else if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
      openFile(file.path);
    }
  }

  function goBack() {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
    setSelectedFile(null);
  }

  function goHome() {
    setCurrentPath('');
    setSelectedFile(null);
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Memory Browser" 
        subtitle="Explore and edit agent memory files"
      />
      
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* File Browser */}
          <Card className="bg-zinc-900/50 border-zinc-800 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={goHome}
                disabled={!currentPath}
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={goBack}
                disabled={!currentPath}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-sm text-zinc-400 overflow-x-auto">
                <button 
                  onClick={goHome}
                  className="hover:text-white transition-colors"
                >
                  workspace
                </button>
                {pathParts.map((part, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="h-4 w-4" />
                    <button 
                      onClick={() => setCurrentPath(pathParts.slice(0, i + 1).join('/'))}
                      className="hover:text-white transition-colors"
                    >
                      {part}
                    </button>
                  </span>
                ))}
              </div>

              <Button 
                variant="ghost" 
                size="icon"
                className="ml-auto"
                onClick={() => fetchDirectory(currentPath)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* File List */}
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-500">Loading...</div>
              ) : files.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">Empty directory</div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileClick(file)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors text-left ${
                        selectedFile?.path === file.path ? 'bg-zinc-800' : ''
                      }`}
                    >
                      {file.type === 'directory' ? (
                        <Folder className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-zinc-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`truncate ${
                            highlighted.includes(file.name) 
                              ? 'text-orange-400 font-medium' 
                              : 'text-white'
                          }`}>
                            {file.name}
                          </span>
                          {highlighted.includes(file.name) && (
                            <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                              key
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          {file.size !== undefined && <span>{formatSize(file.size)}</span>}
                          {file.modified && <span>{formatDate(file.modified)}</span>}
                        </div>
                      </div>
                      {file.type === 'directory' && (
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Preview/Editor */}
          <Card className="bg-zinc-900/50 border-zinc-800 flex flex-col">
            {selectedFile ? (
              <>
                {/* File Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <div>
                    <h3 className="font-medium text-white">{selectedFile.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {formatSize(selectedFile.size)} · {formatDate(selectedFile.modified)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditing(false);
                            setEditContent(selectedFile.content);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            // TODO: Save to API
                            setEditing(false);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* File Content */}
                <CardContent className="flex-1 overflow-y-auto p-0">
                  {editing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  ) : (
                    <pre className="p-4 text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                      {selectedFile.content}
                    </pre>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                  <p>Select a file to preview</p>
                  <p className="text-xs mt-1">Supports .md, .txt, and .json files</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
