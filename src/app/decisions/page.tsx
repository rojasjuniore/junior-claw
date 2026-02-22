'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, X, MessageSquare, Clock, AlertTriangle, 
  Loader2, RefreshCw, CheckCircle, XCircle 
} from 'lucide-react';

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
}

export default function DecisionsPage() {
  const [pending, setPending] = useState<Decision[]>([]);
  const [resolved, setResolved] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function fetchDecisions() {
    try {
      const res = await fetch('/api/decisions');
      const data = await res.json();
      if (data.ok) {
        setPending(data.pending || []);
        setResolved(data.resolved || []);
      }
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActing(id);
    try {
      const res = await fetch('/api/decisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchDecisions();
      }
    } catch (error) {
      console.error('Failed to update decision:', error);
    } finally {
      setActing(null);
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const priorityColors = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const typeIcons = {
    approval: <Check className="h-4 w-4" />,
    review: <MessageSquare className="h-4 w-4" />,
    alert: <AlertTriangle className="h-4 w-4" />,
    info: <MessageSquare className="h-4 w-4" />,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Decision Inbox" 
        subtitle={`${pending.length} pending decisions`}
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Refresh button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setLoading(true); fetchDecisions(); }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Pending Decisions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Pending ({pending.length})
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : pending.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-12 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                <p className="text-zinc-500">No pending decisions. Your agents are handling things smoothly.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pending.map((decision) => (
                <Card key={decision.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Agent Avatar */}
                      <div className="text-3xl">{decision.agentEmoji}</div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-white">{decision.agent}</span>
                          <Badge variant="outline" className={priorityColors[decision.priority]}>
                            {decision.priority}
                          </Badge>
                          <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                            {typeIcons[decision.type]}
                            <span className="ml-1">{decision.type}</span>
                          </Badge>
                          <span className="text-xs text-zinc-500 ml-auto">
                            {formatTime(decision.timestamp)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {decision.title}
                        </h3>
                        
                        <p className="text-sm text-zinc-400 mb-4">
                          {decision.description}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={() => handleAction(decision.id, 'approved')}
                            disabled={acting === decision.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {acting === decision.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleAction(decision.id, 'rejected')}
                            disabled={acting === decision.id}
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Decisions */}
        {resolved.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recent Decisions ({resolved.length})
            </h2>
            
            <div className="space-y-2">
              {resolved.map((decision) => (
                <Card key={decision.id} className="bg-zinc-900/30 border-zinc-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{decision.agentEmoji}</span>
                      <span className="text-sm text-zinc-400 flex-1 truncate">{decision.title}</span>
                      <Badge 
                        className={
                          decision.status === 'approved' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }
                      >
                        {decision.status === 'approved' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {decision.status}
                      </Badge>
                      <span className="text-xs text-zinc-600">
                        {decision.resolvedAt && formatTime(decision.resolvedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
