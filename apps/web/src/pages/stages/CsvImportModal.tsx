import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { parseCsvFile, importCsvRows, type CsvRow, type ImportResult } from '../../lib/csv-tasks';

interface Props {
  projectId: string;
  onClose: () => void;
}

type Step = 'pick' | 'preview' | 'importing' | 'done';
type InputTab = 'file' | 'paste';

export function CsvImportModal({ projectId, onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('pick');
  const [inputTab, setInputTab] = useState<InputTab>('file');
  const [pasteText, setPasteText] = useState('');
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);

  function parseText(text: string) {
    try {
      const parsed = parseCsvFile(text);
      if (parsed.length === 0) {
        setError('Nenhuma linha válida encontrada. Verifique o formato: etapa,topico,subtopico,tempo,tipo,equipes');
        return;
      }
      setRows(parsed);
      setError(null);
      setStep('preview');
    } catch {
      setError('Erro ao processar o texto CSV.');
    }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => parseText(e.target?.result as string);
    reader.readAsText(file, 'utf-8');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    setStep('importing');
    setProgress({ done: 0, total: rows.length });
    try {
      const res = await importCsvRows(projectId, rows, (done, total) => {
        setProgress({ done, total });
      });
      setResult(res);
      setStep('done');
      qc.invalidateQueries({ queryKey: ['stages', projectId] });
    } catch (err: any) {
      setError(err?.message ?? 'Erro durante a importação.');
      setStep('preview');
    }
  }

  function reset() {
    setStep('pick');
    setRows([]);
    setError(null);
    setPasteText('');
  }

  const uniqueStages = new Set(rows.map((r) => r.etapa)).size;
  const uniqueTopics = new Set(rows.map((r) => `${r.etapa}::${r.topico}`)).size;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        width: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="fill">
            <div style={{ fontWeight: 600, fontSize: 15 }}>Importar tarefas via CSV</div>
            <div className="xs faint">etapa · tópico · subtópico · tempo · tipo · equipes</div>
          </div>
          <button className="btn ghost sm" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── PICK ─────────────────────────────────────────────── */}
          {step === 'pick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Tabs */}
              <div className="seg" style={{ alignSelf: 'flex-start' }}>
                <button className={`seg-btn${inputTab === 'file' ? ' active' : ''}`} onClick={() => { setInputTab('file'); setError(null); }}>
                  Arquivo
                </button>
                <button className={`seg-btn${inputTab === 'paste' ? ' active' : ''}`} onClick={() => { setInputTab('paste'); setError(null); }}>
                  Colar texto
                </button>
              </div>

              {inputTab === 'file' ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
                    padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
                    color: 'var(--text-3)', transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  <div className="small b" style={{ color: 'var(--text)', marginBottom: 4 }}>Arraste um arquivo CSV aqui</div>
                  <div className="xs faint">ou clique para selecionar</div>
                  <input
                    ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`Cole o conteúdo CSV aqui, por exemplo:\netapa,topico,subtopico,tempo,tipo,equipes\nDiscovery,Pesquisa,Entrevistas,8,sequencial,UX Team\nDesign,Wireframes,Homepage,24,concomitante,UX Team+Design`}
                    style={{
                      width: '100%', minHeight: 180, padding: '10px 12px', resize: 'vertical',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                      background: 'var(--surface-2)', color: 'var(--text)', fontSize: 12,
                      fontFamily: 'Geist Mono, ui-monospace, monospace', lineHeight: 1.5,
                    }}
                    autoFocus
                  />
                  <button
                    className="btn primary"
                    disabled={!pasteText.trim()}
                    onClick={() => parseText(pasteText)}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    Analisar
                  </button>
                </div>
              )}

              {error && <div className="xs" style={{ color: 'var(--danger)' }}>{error}</div>}

              {/* Format hint */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div className="xs b" style={{ marginBottom: 6 }}>Formato esperado:</div>
                <pre style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', margin: 0, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
{`etapa,topico,subtopico,tempo,tipo,equipes
Discovery,Pesquisa,Entrevistas com usuários,8,sequencial,UX Team
Discovery,Pesquisa,Análise competitiva,16,concomitante,UX Team+Research Team
Design,Wireframes,Homepage,24,sequencial,Design`}
                </pre>
                <div className="xs faint" style={{ marginTop: 8 }}>
                  • Se etapa/tópico/equipe não existir, será criado automaticamente<br />
                  • Se subtópico já existir (mesmo etapa+tópico+nome), será atualizado
                </div>
              </div>
            </div>
          )}

          {/* ── PREVIEW ──────────────────────────────────────────── */}
          {step === 'preview' && (
            <div>
              <div className="row" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
                <span className="chip done">{rows.length} linhas</span>
                <span className="xs faint">{uniqueStages} etapas · {uniqueTopics} tópicos</span>
              </div>
              {error && <div className="xs" style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</div>}
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Etapa</th>
                      <th>Tópico</th>
                      <th>Subtópico</th>
                      <th style={{ width: 50 }}>h</th>
                      <th style={{ width: 60 }}>Tipo</th>
                      <th>Equipes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 60).map((r, i) => (
                      <tr key={i}>
                        <td className="xs">{r.etapa}</td>
                        <td className="xs">{r.topico}</td>
                        <td className="xs b">{r.subtopico}</td>
                        <td className="xs mono">{r.tempo}</td>
                        <td className="xs faint">{r.tipo === 'concomitante' ? 'Conc.' : 'Seq.'}</td>
                        <td className="xs faint">{r.equipes.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 60 && (
                  <div className="xs faint" style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                    + {rows.length - 60} linhas não exibidas
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── IMPORTING ────────────────────────────────────────── */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ marginBottom: 14, fontSize: 14 }}>
                Processando... {progress.done}/{progress.total}
              </div>
              <div className="bar thick" style={{ margin: '0 auto', width: '100%' }}>
                <span style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* ── DONE ─────────────────────────────────────────────── */}
          {step === 'done' && result && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Importação concluída</div>
              </div>
              <div className="row" style={{ gap: 10, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                {result.created > 0 && <div className="chip done">{result.created} criadas</div>}
                {result.updated > 0 && <div className="chip accent">{result.updated} atualizadas</div>}
                {result.skipped > 0 && <div className="chip blocked">{result.skipped} com erro</div>}
              </div>
              {result.errors.length > 0 && (
                <div style={{ background: 'var(--danger-soft)', borderRadius: 'var(--radius)', padding: 12 }}>
                  <div className="xs b" style={{ color: 'var(--danger)', marginBottom: 6 }}>Erros:</div>
                  {result.errors.map((e, i) => (
                    <div key={i} className="xs" style={{ color: 'var(--danger)', marginBottom: 2 }}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {step === 'done' ? (
            <button className="btn primary" onClick={onClose}>Fechar</button>
          ) : step === 'preview' ? (
            <>
              <button className="btn ghost" onClick={reset}>Voltar</button>
              <button className="btn primary" onClick={handleImport}>
                Importar {rows.length} tarefas
              </button>
            </>
          ) : step === 'pick' ? (
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
