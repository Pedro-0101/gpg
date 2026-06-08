/**
 * Calcula datas de início/fim de subtópicos, tópicos e etapas.
 *
 * Regras:
 * - Etapas são sempre sequenciais (etapa N começa quando etapa N-1 termina)
 * - Tópicos dentro de uma etapa são sempre sequenciais (tópico N começa quando tópico N-1 termina)
 * - Subtópicos dentro de um tópico:
 *   - isConcurrent=true  → todos começam ao mesmo tempo, no início do tópico (bloco paralelo)
 *   - isConcurrent=false → sequencial, começa após o bloco concurrent terminar e após o anterior sequencial
 */

import { addDays, getDay } from 'date-fns';

function isWorkingDay(date: Date): boolean {
  const day = getDay(date);
  return day !== 0 && day !== 6; // 0=domingo, 6=sábado
}

function toNextWorkingDay(date: Date): Date {
  let result = new Date(date);
  while (!isWorkingDay(result)) {
    result = addDays(result, 1);
  }
  return result;
}

interface SubtopicInput {
  id: string;
  durationHours: number;
  isConcurrent: boolean;
  order: number;
}

interface TopicInput {
  id: string;
  order: number;
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
  const whole = Math.floor(days);
  const frac = days - whole;

  // Se começar em fim de semana, avança para segunda
  let result = toNextWorkingDay(start);

  // Adiciona dias úteis inteiros, pulando fins de semana
  let remaining = whole;
  while (remaining > 0) {
    result = addDays(result, 1);
    if (isWorkingDay(result)) {
      remaining--;
    }
  }

  // Fração de dia útil → adiciona 1 dia útil extra (simplificação)
  if (frac > 0) {
    result = addDays(result, 1);
    result = toNextWorkingDay(result);
  }

  return result;
}

function scheduleTopic(topic: TopicInput, topicStart: Date, dailyHours: number): ScheduledTopic {
  const subtopics: ScheduledSubtopic[] = [];
  const sorted = [...topic.subtopics].sort((a, b) => a.order - b.order);

  const concurrent = sorted.filter((s) => s.isConcurrent);
  const sequential = sorted.filter((s) => !s.isConcurrent);

  // Bloco concurrent: todas as tasks paralelas começam juntas no início do tópico
  let concurrentEnd = topicStart;
  for (const sub of concurrent) {
    const end = addWorkDays(topicStart, hoursToWorkDays(sub.durationHours, dailyHours));
    subtopics.push({ id: sub.id, startDate: topicStart, endDate: end });
    if (end > concurrentEnd) concurrentEnd = end;
  }

  // Tasks sequenciais: encadeiam após o bloco concurrent (ou início do tópico se não houver concurrent)
  let cursor = concurrentEnd;
  for (const sub of sequential) {
    const end = addWorkDays(cursor, hoursToWorkDays(sub.durationHours, dailyHours));
    subtopics.push({ id: sub.id, startDate: cursor, endDate: end });
    cursor = end;
  }

  const topicEnd = subtopics.length > 0
    ? subtopics.reduce((max, s) => (s.endDate > max ? s.endDate : max), topicStart)
    : topicStart;

  return { id: topic.id, startDate: topicStart, endDate: topicEnd, subtopics };
}

export function calculateSchedule(
  projectStart: Date,
  dailyHours: number,
  stages: StageInput[],
): ScheduledStage[] {
  const result: ScheduledStage[] = [];
  let stageCursor = new Date(projectStart);

  for (const stage of [...stages].sort((a, b) => a.order - b.order)) {
    const stageStart = stageCursor;
    const scheduledTopics: ScheduledTopic[] = [];

    // Tópicos sequenciais dentro da etapa
    let topicCursor = stageStart;
    for (const topic of [...stage.topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
      const scheduled = scheduleTopic(topic, topicCursor, dailyHours);
      scheduledTopics.push(scheduled);
      topicCursor = scheduled.endDate;
    }

    const stageEnd = scheduledTopics.length > 0
      ? scheduledTopics[scheduledTopics.length - 1].endDate
      : stageStart;

    result.push({ id: stage.id, startDate: stageStart, endDate: stageEnd, topics: scheduledTopics });
    stageCursor = stageEnd;
  }

  return result;
}
