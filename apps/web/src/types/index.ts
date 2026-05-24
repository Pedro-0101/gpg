export interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  dailyHours: number;
  status: string;
  totalBudget: string | number | null;
  client: string | null;
  managerId: string | null;
  color: string;
  createdAt: string;
  _count?: { stages: number; teams: number; stakeholders: number };
}

export interface Stage {
  id: string;
  projectId: string;
  name: string;
  order: number;
  startDate: string | null;
  endDate: string | null;
  topics: Topic[];
  _count?: { topics: number };
}

export interface Topic {
  id: string;
  stageId: string;
  name: string;
  order: number;
  startDate: string | null;
  endDate: string | null;
  subtopics: Subtopic[];
}

export type SubtopicStatus = 'todo' | 'inprog' | 'review' | 'done' | 'blocked';
export type SubtopicPriority = 'high' | 'med' | 'low';
export type SubtopicType = 'task' | 'milestone' | 'deliverable';

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  description: string | null;
  durationHours: number;
  isConcurrent: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
  teamId: string | null;
  team: Team | null;
  status: SubtopicStatus;
  progress: number;
  spentHours: number;
  deadline: string | null;
  taskType: SubtopicType;
  priority: SubtopicPriority;
  assignments: SubtopicAssignment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubtopicAssignment {
  subtopicId: string;
  memberId: string;
  member: TeamMember;
}

export interface TeamMember {
  id: string;
  projectId: string;
  name: string;
  initials: string;
  role: string;
  skills: string[];
  avatarColor: number;
  createdAt: string;
}

export interface Professional {
  id: string;
  projectId: string;
  role: string;
  hourlyCost: number | string;
}

export interface TeamProfessional {
  professionalId: string;
  quantity: number;
  professional: Professional;
}

export interface Team {
  id: string;
  projectId: string;
  name: string;
  professionals: TeamProfessional[];
  totalCost?: number;
}

export interface Stakeholder {
  id: string;
  projectId: string;
  name: string;
  role: string | null;
  organization: string | null;
  type: string;
  influence: number;
  interest: number;
  engagementLevel: string;
  contactInfo: string | null;
}

export interface CostEntry {
  id: string;
  projectId: string;
  stageId: string | null;
  memberId: string | null;
  description: string;
  category: string;
  amount: string | number;
  hours: number | null;
  date: string;
  stage?: Stage | null;
  member?: TeamMember | null;
  createdAt: string;
}

export interface CostSummary {
  totalSpent: number;
  byCategory: Record<string, number>;
  count: number;
}

export interface Risk {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  probability: 'high' | 'med' | 'low';
  impact: 'high' | 'med' | 'low';
  status: 'active' | 'resolved' | 'accepted';
  responsePlan: string | null;
  dueDate: string | null;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  stageId: string | null;
  name: string;
  date: string;
  status: 'pending' | 'reached' | 'missed';
  createdAt: string;
}

export interface Decision {
  id: string;
  projectId: string;
  memberId: string | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'pending' | 'decided' | 'cancelled';
  member?: TeamMember | null;
  createdAt: string;
}

export interface SubtopicComment {
  id: string;
  subtopicId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface SubtopicAttachment {
  id: string;
  subtopicId: string;
  name: string;
  size: number;
  url: string;
  mimeType: string;
  isExternal: boolean;
  uploadedAt: string;
}

export interface MemberMetrics {
  memberId: string;
  name: string;
  activeTasks: number;
  completedTasks: number;
  loadPercent: number;
  spentHours: number;
  estimatedHours: number;
  performance: number;
}
