import { stagesApi } from '../api/stages';
import { topicsApi } from '../api/topics';
import { subtopicsApi } from '../api/subtopics';
import { teamsApi } from '../api/teams';

export interface CsvRow {
  etapa: string;
  topico: string;
  subtopico: string;
  tempo: number;
  tipo: 'sequencial' | 'concomitante';
  equipes: string[];
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// Parse a CSV string into rows, handling quoted fields
function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

function parseCsvRaw(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    rows.push(parseCsvLine(line));
  }
  return rows;
}

export function parseCsvFile(text: string): CsvRow[] {
  const rows = parseCsvRaw(text);
  if (rows.length === 0) return [];

  const firstRow = rows[0].map((c) => c.toLowerCase());
  const startIdx = firstRow.some((c) => ['etapa', 'subtopico', 'topico'].includes(c)) ? 1 : 0;

  const result: CsvRow[] = [];
  for (let i = startIdx; i < rows.length; i++) {
    const [etapa = '', topico = '', subtopico = '', tempo = '', tipo = '', equipes = ''] = rows[i];
    if (!etapa || !topico || !subtopico) continue;
    const hours = parseInt(tempo, 10);
    if (isNaN(hours) || hours < 1) continue;
    result.push({
      etapa: etapa.trim(),
      topico: topico.trim(),
      subtopico: subtopico.trim(),
      tempo: hours,
      tipo: tipo.trim().toLowerCase() === 'concomitante' ? 'concomitante' : 'sequencial',
      equipes: equipes.split('+').map((e) => e.trim()).filter(Boolean),
    });
  }
  return result;
}

export async function importCsvRows(
  projectId: string,
  rows: CsvRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const total = rows.length;

  // Load existing data upfront
  const [existingStages, existingTeams] = await Promise.all([
    stagesApi.list(projectId) as Promise<any[]>,
    teamsApi.list(projectId) as Promise<any[]>,
  ]);

  // stage name (lower) → stage object
  const stageByName = new Map<string, any>(existingStages.map((s) => [s.name.toLowerCase(), s]));

  // "stageId::topic name (lower)" → topic object (with subtopics)
  const topicByKey = new Map<string, any>();
  for (const s of existingStages) {
    for (const t of (s.topics ?? [])) {
      topicByKey.set(`${s.id}::${t.name.toLowerCase()}`, t);
    }
  }

  // "topicId::subtopic name (lower)" → subtopic object
  const subtopicByKey = new Map<string, any>();
  for (const s of existingStages) {
    for (const t of (s.topics ?? [])) {
      for (const sub of (t.subtopics ?? [])) {
        subtopicByKey.set(`${t.id}::${sub.name.toLowerCase()}`, sub);
      }
    }
  }

  // team name (lower) → team id
  const teamById = new Map<string, string>(existingTeams.map((t: any) => [t.name.toLowerCase(), t.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // ── Find or create stage ────────────────────────────────────────
      let stage = stageByName.get(row.etapa.toLowerCase());
      let stageId: string;
      if (stage) {
        stageId = stage.id;
      } else {
        stage = await stagesApi.create(projectId, { name: row.etapa, order: stageByName.size + 1 }) as any;
        stageId = stage.id;
        stage.topics = [];
        stageByName.set(row.etapa.toLowerCase(), stage);
      }

      // ── Find or create topic ────────────────────────────────────────
      const topicKey = `${stageId}::${row.topico.toLowerCase()}`;
      let topic = topicByKey.get(topicKey);
      let topicId: string;
      if (topic) {
        topicId = topic.id;
      } else {
        topic = await topicsApi.create(projectId, stageId, {
          name: row.topico,
          order: topicByKey.size + 1,
        }) as any;
        topicId = topic.id;
        topic.subtopics = [];
        topicByKey.set(topicKey, topic);
      }

      // ── Resolve teams ───────────────────────────────────────────────
      const teamIds: string[] = [];
      for (const teamName of row.equipes) {
        const key = teamName.toLowerCase();
        let teamId = teamById.get(key);
        if (!teamId) {
          const t = await teamsApi.create(projectId, { name: teamName, professionals: [] }) as any;
          teamId = t.id as string;
          teamById.set(key, teamId);
        }
        teamIds.push(teamId);
      }

      // ── Find existing subtopic ──────────────────────────────────────
      const subKey = `${topicId}::${row.subtopico.toLowerCase()}`;
      const existingSub = subtopicByKey.get(subKey);

      if (existingSub) {
        // UPDATE: overwrite duration, concurrent flag and teams
        await subtopicsApi.update(projectId, stageId, topicId, existingSub.id, {
          durationHours: row.tempo,
          isConcurrent: row.tipo === 'concomitante',
          teamIds,
        });
        result.updated++;
      } else {
        // CREATE
        const newSub = await subtopicsApi.create(projectId, stageId, topicId, {
          name: row.subtopico,
          durationHours: row.tempo,
          isConcurrent: row.tipo === 'concomitante',
          teamIds,
          order: (topic.subtopics?.length ?? 0) + 1,
          status: 'todo',
          progress: 0,
          spentHours: 0,
          taskType: 'task',
          priority: 'med',
        }) as any;
        // Add to cache to catch duplicates within the same import batch
        subtopicByKey.set(subKey, newSub);
        topic.subtopics = [...(topic.subtopics ?? []), newSub];
        result.created++;
      }
    } catch (err: any) {
      result.errors.push(`Linha ${i + 1} (${row.subtopico}): ${err?.message ?? 'Erro desconhecido'}`);
      result.skipped++;
    }
    onProgress?.(i + 1, total);
  }

  return result;
}

export async function fetchAndGenerateCsv(projectId: string): Promise<string> {
  const stages = await stagesApi.list(projectId) as any[];
  return generateCsv(stages);
}

export function generateCsv(stages: any[]): string {
  const header = 'etapa,topico,subtopico,tempo,tipo,equipes';
  const lines: string[] = [header];

  for (const stage of stages) {
    for (const topic of (stage.topics ?? [])) {
      for (const sub of (topic.subtopics ?? [])) {
        const equipes = (sub.teams ?? [])
          .map((t: any) => t.team?.name ?? '')
          .filter(Boolean)
          .join('+');
        lines.push([
          csvEscape(stage.name),
          csvEscape(topic.name),
          csvEscape(sub.name),
          String(sub.durationHours),
          sub.isConcurrent ? 'concomitante' : 'sequencial',
          csvEscape(equipes),
        ].join(','));
      }
    }
  }

  return lines.join('\n');
}

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
