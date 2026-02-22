// Squad agents configuration
export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  color: string;
  position: { x: number; y: number };
  department: 'executive' | 'engineering' | 'operations' | 'business' | 'support';
}

export const agents: Agent[] = [
  {
    id: 'junior-claw',
    name: 'Junior Claw',
    emoji: '🦞',
    role: 'CEO & Copilot',
    color: '#F97316',
    position: { x: 1, y: 1 },
    department: 'executive',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    emoji: '🎨',
    role: 'Frontend Specialist',
    color: '#EC4899',
    position: { x: 0, y: 2 },
    department: 'engineering',
  },
  {
    id: 'stack',
    name: 'Stack',
    emoji: '🔌',
    role: 'Backend Engineer',
    color: '#8B5CF6',
    position: { x: 1, y: 2 },
    department: 'engineering',
  },
  {
    id: 'shield',
    name: 'Shield',
    emoji: '🛡️',
    role: 'QA & Security',
    color: '#10B981',
    position: { x: 2, y: 2 },
    department: 'engineering',
  },
  {
    id: 'pipeline',
    name: 'Pipeline',
    emoji: '🚀',
    role: 'DevOps & Deploy',
    color: '#3B82F6',
    position: { x: 3, y: 2 },
    department: 'engineering',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    emoji: '👁️',
    role: 'Monitoring & Ops',
    color: '#6366F1',
    position: { x: 0, y: 3 },
    department: 'operations',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    emoji: '📋',
    role: 'Project Manager',
    color: '#14B8A6',
    position: { x: 3, y: 1 },
    department: 'operations',
  },
  {
    id: 'hunter',
    name: 'Hunter',
    emoji: '🎯',
    role: 'BizDev & Sales',
    color: '#F59E0B',
    position: { x: 4, y: 1 },
    department: 'business',
  },
  {
    id: 'scope',
    name: 'Scope',
    emoji: '🔭',
    role: 'Proposals & Scoping',
    color: '#84CC16',
    position: { x: 4, y: 2 },
    department: 'business',
  },
  {
    id: 'vox',
    name: 'Vox',
    emoji: '📢',
    role: 'Marketing & Content',
    color: '#F472B6',
    position: { x: 1, y: 3 },
    department: 'business',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    emoji: '💰',
    role: 'Finance & Billing',
    color: '#22C55E',
    position: { x: 2, y: 3 },
    department: 'business',
  },
  {
    id: 'echo',
    name: 'Echo',
    emoji: '🤝',
    role: 'Customer Support',
    color: '#06B6D4',
    position: { x: 3, y: 3 },
    department: 'support',
  },
];

export const getAgentById = (id: string) => agents.find(a => a.id === id);
export const getAgentsByDepartment = (dept: Agent['department']) => 
  agents.filter(a => a.department === dept);
