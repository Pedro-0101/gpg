/**
 * Calcula datas de início/fim de subtópicos, tópicos e etapas.
 *
 * Regras:
 * - Etapas são sempre sequenciais (etapa N começa quando etapa N-1 termina)
 * - Tópicos dentro de uma etapa são concorrentes (todos começam no início da etapa)
 * - Subtópicos dentro de um tópico:
 *   - isConcurrent=true  → todos começam no início do tópico (paralelo)
 *   - isConcurrent=false → sequential, começa após o último concurrent ou sequential anterior
 */

import { addDays } from 'date-fns';

interface SubtopicInput {
  id: string;
  durationHours: number;
  isConcurrent: boolean;
  order: number;
}

interface TopicInput {
  id: string;
  subtopics: SubtopicInput[];
}

interface StageInput {
  id: string;
  order: number;
  topics: TopicInput[];
}

export interface ScheduledSubtopic {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface ScheduledTopic {
  id: string;
  startDate: Date;
  endDate: Date;
  subtopics: ScheduledSubtopic[];
}

export interface ScheduledStage {
  id: string;
  startDate: Date;
  endDate: Date;
  topics: ScheduledTopic[];
}

function hoursToWorkDays(hours: number, dailyHours: number): number {
  return hours / dailyHours;
}

function addWorkDays(start: Date, days: number): Date {
  if (days <= 0) return start;
  const wholeDays = Math.floor(days);
  const fractional = days - wholeDays;
  const result = addDays(start, wholeDays);
  if (fractional > 0) {
    return addDays(result, 1);
  }
  return result;
}

function scheduleTopic(topic: TopicInput, topicStart: Date, dailyHours: number): ScheduledTopic {
  const subtopics: ScheduledSubtopic[] = [];

  const sorted = [...topic.subtopics].sort((a, b) => a.order - b.order);

  // Concurrent subtopics all start at topicStart
  const concurrent = sorted.filter((s) => s.isConcurrent);
  const sequential = sorted.filter((s) => !s.isConcurrent);

  let concurrentEnd = topicStart;

  for (const sub of concurrent) {
    const days = hoursToWorkDays(sub.durationHours, dailyHours);
    const endDate = addWorkDays(topicStart, days);
    subtopics.push({ id: sub.id, startDate: topicStart, endDate });
    if (endDate > concurrentEnd) concurrentEnd = endDate;
  }

  // Sequential subtopics start after all concurrent ones finish
  let cursor = concurrentEnd;
  for (const sub of sequential) {
    const days = hoursToWorkDays(sub.durationHours, dailyHours);
    const endDate = addWorkDays(cursor, days);
    subtopics.push({ id: sub.id, startDate: cursor, endDate });
    cursor = endDate;
  }

  const topicEnd = subtopics.length > 0 ? subtopics.reduce((max, s) => (s.endDate > max ? s.endDate : max), topicStart) : topicStart;

  return { id: topic.id, startDate: topicStart, endDate: topicEnd, subtopics };
}

export function calculateSchedule(
  projectStart: Date,
  dailyHours: number,
  stages: StageInput[],
): ScheduledStage[] {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const result: ScheduledStage[] = [];

  let cursor = projectStart;

  for (const stage of sorted) {
    const stageStart = cursor;
    const scheduledTopics: ScheduledTopic[] = [];

    // All topics within a stage are concurrent (start at stageStart)
    for (const topic of stage.topics) {
      scheduledTopics.push(scheduleTopic(topic, stageStart, dailyHours));
    }

    const stageEnd =
      scheduledTopics.length > 0
        ? scheduledTopics.reduce((max, t) => (t.endDate > max ? t.endDate : max), stageStart)
        : stageStart;

    result.push({ id: stage.id, startDate: stageStart, endDate: stageEnd, topics: scheduledTopics });
    cursor = stageEnd;
  }

  return result;
}
