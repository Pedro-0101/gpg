export interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  dailyHours: number;
  status: string;
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
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
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
