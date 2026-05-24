# DESIGN_PLAN.md — Implementação Visual do GPG

> **Instrução:** Este documento é auto-suficiente para qualquer IA implementar a camada visual do sistema GPG. Leia todo o arquivo antes de começar. A seção **Requisitos Funcionais Faltantes** deve ser implementada **antes** de qualquer trabalho visual.

---

## 1. Decisões de design (fonte: chats/chat1.md)

A escolha final para todas as telas foi **Opção B** (exceto Gantt, que usa **Opção A** com swimlanes). Resumo das escolhas:

| Tela | Variante escolhida | Descrição |
|------|-------------------|-----------|
| Dashboard | B | Hero de projeto + anel de progresso + alertas |
| Gantt | A (swimlanes) | Swimlanes por tópico + milestones + riscos |
| Tarefas | B (Kanban) | Kanban agrupado por etapa |
| Equipe | B | Cards por pessoa com sparkline de performance |
| Custos | B | Burndown financeiro + alertas |
| Detalhe Tarefa | B | Hero denso com meta strip (breadcrumb + chips inline) |
| Detalhe Projeto | B | Grid de cards (etapas + KPIs + equipe + entregas) |
| Relatórios | B | Resumo executivo estilo storyboard |

---

## 2. Design Token System

### 2.1 Tipografia

```css
/* Instalar via Google Fonts ou CDN */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;600&display=swap');

:root {
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'Fira Code', monospace;
  font-family: var(--font-sans);
  font-size: 13px; /* base menor que o padrão — sensação densa e profissional */
}
```

### 2.2 Paleta de cores — tema claro (padrão)

```css
:root {
  /* Superfícies */
  --surface:   #FFFFFF;
  --surface-2: #F7F7F8;
  --surface-3: #EFEFEF;

  /* Texto */
  --text:   #111111;
  --text-2: #555555;
  --text-3: #AAAAAA;

  /* Borda */
  --border: #E5E5E5;

  /* Acento (configurável pelo usuário) */
  --accent:      #4F46E5;
  --accent-soft: #4F46E51A; /* accent + 10% alpha */
  --accent-text: #4F46E5;

  /* Status */
  --success:      #10B981;
  --success-soft: #10B98115;
  --warning:      #F59E0B;
  --warning-soft: #F59E0B15;
  --danger:       #EF4444;
  --danger-soft:  #EF444415;
  --info:         #0EA5E9;
  --info-soft:    #0EA5E915;

  /* Extra */
  --purple: #7C3AED;

  /* Sidebar */
  --sb-bg:   #F7F7F8;
  --sb-w:    220px;
}
```

### 2.3 Tema escuro

```css
body.theme-dark {
  --surface:   #111111;
  --surface-2: #1A1A1A;
  --surface-3: #252525;
  --text:      #F0F0F0;
  --text-2:    #9A9A9A;
  --text-3:    #555555;
  --border:    #2A2A2A;
  --sb-bg:     #161616;
  --accent-soft: #4F46E526;
}
```

### 2.4 Layout raiz

```
.frame {
  display: grid;
  grid-template-columns: var(--sb-w) 1fr;
  height: 100vh;
  overflow: hidden;
  background: var(--surface-2);
}

.sidebar {
  background: var(--sb-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 12px 8px;
}

.main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 48px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  flex-shrink: 0;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.content.tight { padding: 20px; }
```

---

## 3. Componentes Atômicos

### 3.1 `.card`

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.card-title { font-weight: 600; font-size: 13px; }
.card-sub { color: var(--text-3); font-size: 12px; margin-left: 6px; }

.card-body { padding: 14px 16px; }
.card-body.flush { padding: 0; }
```

### 3.2 `.kpi-grid` e `.card.kpi`

```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.card.kpi { padding: 14px 16px; }
.card.kpi .label { font-size: 11px; color: var(--text-3); margin-bottom: 4px; }
.card.kpi .value { font-size: 26px; font-weight: 700; display: flex; align-items: baseline; gap: 8px; }
.card.kpi .sub   { font-size: 11px; color: var(--text-3); margin-top: 2px; }

.delta { font-size: 12px; font-weight: 600; }
.delta.up   { color: var(--success); }
.delta.down { color: var(--danger); }
.delta.flat { color: var(--text-3); }
```

### 3.3 `.chip` e variantes

```css
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 500; white-space: nowrap;
}

.chip.outline { border: 1px solid var(--border); color: var(--text-2); background: transparent; }
.chip.accent  { background: var(--accent-soft); color: var(--accent-text); }
.chip.done    { background: var(--success-soft); color: var(--success); }
.chip.inprog  { background: var(--accent-soft);  color: var(--accent-text); }
.chip.review  { background: var(--warning-soft); color: var(--warning); }
.chip.todo    { background: var(--surface-3);    color: var(--text-2); }
.chip.blocked { background: var(--danger-soft);  color: var(--danger); }
.chip.high    { background: var(--danger-soft);  color: var(--danger); }
.chip.med     { background: var(--warning-soft); color: var(--warning); }
.chip.low     { background: var(--success-soft); color: var(--success); }
.chip.xs      { padding: 1px 6px; font-size: 10px; }
.chip.mono    { font-family: var(--font-mono); }

.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; }
```

### 3.4 `.btn` e `.icon-btn`

```css
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--border); background: var(--surface);
  color: var(--text); cursor: pointer; white-space: nowrap;
  transition: background 0.1s;
}
.btn:hover { background: var(--surface-2); }
.btn.primary { background: var(--accent); color: white; border-color: transparent; }
.btn.primary:hover { filter: brightness(1.1); }
.btn.ghost { border-color: transparent; background: transparent; }
.btn.ghost:hover { background: var(--surface-2); }
.btn.sm { padding: 4px 10px; font-size: 11px; }
.btn.fill { flex: 1; justify-content: center; }

.icon-btn {
  display: grid; place-items: center;
  width: 30px; height: 30px; border-radius: 6px;
  border: 1px solid var(--border); background: var(--surface); cursor: pointer;
}
.icon-btn.ghost { border-color: transparent; background: transparent; }
.icon-btn:hover { background: var(--surface-2); }
```

### 3.5 `.seg` (segmented control)

```css
.seg { display: flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.seg-btn { padding: 4px 10px; font-size: 11px; background: transparent; border: none; cursor: pointer; color: var(--text-2); }
.seg-btn.active { background: var(--accent); color: white; }
```

### 3.6 `.bar` (progress bar)

```css
.bar {
  height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden;
  flex-shrink: 0;
}
.bar.fill { flex: 1; }
.bar.thick { height: 8px; }
.bar span { display: block; height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.3s; }
.bar.success span { background: var(--success); }
```

### 3.7 `.tbl` (tabela)

```css
.tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.tbl thead tr { border-bottom: 1px solid var(--border); }
.tbl th { padding: 8px 12px; text-align: left; font-size: 11px; color: var(--text-3); font-weight: 500; }
.tbl td { padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.tbl tbody tr:last-child td { border-bottom: none; }
.tbl tbody tr:hover td { background: var(--surface-2); }
.tbl td.right, .tbl th.right { text-align: right; }
.tbl td.mono { font-family: var(--font-mono); }
```

### 3.8 `.sidebar` items

```css
.sb-workspace {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 6px 10px;
}
.sb-logo {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--accent); color: white;
  display: grid; place-items: center; font-weight: 700; font-size: 16px;
}
.sb-wsname { font-weight: 600; font-size: 13px; }
.sb-wssub  { font-size: 10px; color: var(--text-3); }
.sb-section { font-size: 10px; font-weight: 600; color: var(--text-3); letter-spacing: 0.08em; padding: 10px 6px 4px; text-transform: uppercase; }
.sb-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 6px; font-size: 12.5px; cursor: pointer;
  color: var(--text-2); position: relative;
}
.sb-item:hover { background: var(--surface-3); color: var(--text); }
.sb-item.active { background: var(--accent-soft); color: var(--accent-text); font-weight: 500; }
.sb-item .icon { width: 16px; display: grid; place-items: center; color: inherit; }
.sb-item .count { margin-left: auto; font-size: 10px; background: var(--surface-3); padding: 1px 6px; border-radius: 10px; color: var(--text-2); }
.sb-item.active .count { background: var(--accent); color: white; }
.sb-project-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
```

### 3.9 `.av` (avatar)

```css
.av {
  display: inline-grid; place-items: center;
  width: 28px; height: 28px; border-radius: 50%;
  font-size: 10px; font-weight: 600; flex-shrink: 0;
}
.av.sm  { width: 22px; height: 22px; font-size: 9px; }
.av.xl  { width: 42px; height: 42px; font-size: 15px; }

/* Color palette (6 slots) */
.av-c1 { background: #DDD6FE; color: #5B21B6; }
.av-c2 { background: #BFDBFE; color: #1E40AF; }
.av-c3 { background: #BBF7D0; color: #065F46; }
.av-c4 { background: #FDE68A; color: #92400E; }
.av-c5 { background: #FECACA; color: #991B1B; }
.av-c6 { background: #E9D5FF; color: #6B21A8; }
.av-c8 { background: var(--surface-3); color: var(--text-2); }

.av-stack { display: flex; }
.av-stack .av { margin-left: -6px; border: 2px solid var(--surface); }
.av-stack .av:first-child { margin-left: 0; }
```

### 3.10 `.list-item`

```css
.list-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-bottom: 1px solid var(--border);
}
.list-item:last-child { border-bottom: none; }
```

### 3.11 `.outline-row` (hierarquia de tarefas)

```css
.outline { font-size: 12.5px; }
.outline-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; border-bottom: 1px solid var(--border);
}
.outline-row.stage { background: var(--surface-2); font-weight: 600; font-size: 12px; }
.outline-row.topic { padding-left: 28px; background: transparent; color: var(--text-2); font-size: 12px; }
.outline-row.task  { padding-left: 48px; }

.chev { cursor: pointer; transition: transform 0.15s; color: var(--text-3); }
.chev.open { transform: rotate(90deg); }
.check { width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid var(--border); flex-shrink: 0; }
.check.done { background: var(--success); border-color: var(--success); }
```

### 3.12 `.kanban`

```css
.kanban {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
}
.kanban-col {
  display: flex; flex-direction: column; gap: 8px;
  background: var(--surface-2); border-radius: 8px; padding: 10px;
}
.kanban-col-head {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 500; color: var(--text-2); padding: 2px 0 6px;
}
.kanban-col-head .count { font-size: 10px; background: var(--surface-3); padding: 1px 5px; border-radius: 8px; }
.kanban-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  padding: 12px; display: flex; flex-direction: column; gap: 8px; cursor: pointer;
}
.kanban-card:hover { border-color: var(--accent); }
.kanban-card .title { font-size: 12.5px; font-weight: 500; line-height: 1.4; }
.kanban-card .foot { display: flex; align-items: center; justify-content: space-between; }
```

### 3.13 `.tab-bar`

```css
.tab-bar {
  display: flex; gap: 0; border-bottom: 1px solid var(--border);
  padding: 0 24px; background: var(--surface); flex-shrink: 0;
}
.tb-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 10px 14px; font-size: 12.5px; cursor: pointer;
  color: var(--text-2); border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.tb-tab:hover { color: var(--text); }
.tb-tab.active { color: var(--accent-text); border-bottom-color: var(--accent); font-weight: 500; }
.tb-tab .count { font-size: 10px; background: var(--surface-3); padding: 1px 5px; border-radius: 8px; }
```

### 3.14 `.page-head`

```css
.page-head {
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px;
}
.page-title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
.page-sub   { font-size: 12px; color: var(--text-3); margin-top: 2px; }
```

### 3.15 `.topbar` breadcrumbs

```css
.bread { display: flex; align-items: center; gap: 4px; flex: 1; }
.sep   { color: var(--text-3); font-size: 12px; }
.crumb { font-size: 12.5px; color: var(--text-2); }
.crumb.curr { color: var(--text); font-weight: 500; }
.search-mini {
  display: flex; align-items: center; gap: 6px;
  background: var(--surface-3); border-radius: 6px; padding: 5px 10px;
  font-size: 12px; color: var(--text-3); cursor: pointer;
}
.kbd { border: 1px solid var(--border); border-radius: 3px; padding: 0 4px; font-size: 10px; }
```

### 3.16 `.grid-2`, `.grid-3`, `.col`, `.row`

```css
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.col    { display: flex; flex-direction: column; }
.row    { display: flex; align-items: center; gap: 8px; }
.row.between { justify-content: space-between; }
.fill   { flex: 1; min-width: 0; }
.b      { font-weight: 600; }
.xs     { font-size: 11px; }
.small  { font-size: 12.5px; }
.mono   { font-family: var(--font-mono); }
.faint  { color: var(--text-3); }
.muted  { color: var(--text-2); }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.divider { height: 1px; background: var(--border); margin: 8px 0; }
```

### 3.17 `Sparkline` (SVG inline)

```tsx
// Componente React puro — sem dependência de biblioteca de gráficos
function Sparkline({ points, color = 'var(--accent)' }) {
  const max = Math.max(...points), min = Math.min(...points);
  const w = 100, h = 30;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min || 1)) * h;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
```

---

## 4. Estrutura de Navegação (Sidebar)

```
ACME STUDIO (workspace)
├── [buscar ⌘K]
│
├── Dashboard
├── Minhas tarefas  [badge: 6]
├── Inbox           [badge: 12]
├── Calendário
│
── WORKSPACE ──
├── Gantt
├── Equipe
├── Custos
├── Relatórios
│
── PROJETOS ──
├── ● Zeeker App     (cor #6366F1)
├── ● Slash Motion   (cor #EC4899)
├── ...
│
└── + Novo projeto
└── ⚙ Configurações
```

**Mapeamento atual → novo:**
- "Visão Geral" → aba dentro de Projeto Detail
- "Etapas & Tarefas" → "Tarefas" (com views: Lista / Kanban / Gantt)
- "Profissionais" → aba dentro de "Equipe"
- "Equipes" → "Equipe"
- "Stakeholders" → aba dentro de Projeto Detail

---

## 5. Telas — Especificações

### 5.1 Dashboard (DashboardB — escolhida)

**Layout:** hero de projeto + KPIs em grid + lista de alertas/pendências

**Estrutura:**
```
Topbar: [Acme Studio / Dashboard] [Filtros] [Novo lançamento]
Content:
  ┌── Hero card (projeto atual) ─────────────────────────────┐
  │  Nome projeto · status · cliente · PM · cor              │
  │  4 KPIs: Progresso %, Orçamento gasto, Equipe, Prazo    │
  │  Progress ring (SVG) 57% + mini-timeline de etapas      │
  └──────────────────────────────────────────────────────────┘
  ┌── Coluna esq (2/3) ──┐  ┌── Coluna dir (1/3) ──┐
  │ Etapa atual · tasks  │  │ Alertas / Riscos      │
  │ Burndown mini chart  │  │ Próximas entregas     │
  └──────────────────────┘  └───────────────────────┘
```

**KPIs:** Progresso (%), Orçamento (R$ gasto / total), Equipe ativa (nº), Prazo (dias restantes)

**Mini burndown:** SVG path simples — linha ideal (dashed) + linha real; sem biblioteca

**Progress ring:** SVG `<circle>` com `stroke-dasharray` e `stroke-dashoffset`

---

### 5.2 Gantt (GanttB — swimlanes)

**Layout:** swimlanes por tópico dentro de cada etapa

**Estrutura:**
```
Topbar: [breadcrumb] [Filtros] [Exportar] [Nova tarefa]
Extra: [seg: Sem | Mês* | Trim]

Content:
  ┌── Gantt container ─────────────────────────────────────┐
  │  Header: colunas de tempo (semanas / meses)            │
  │  Por etapa:                                            │
  │    ETAPA 1 — Discovery [barra de etapa — verde]        │
  │      └ Pesquisa     [barras de subtópicos — accent]    │
  │      └ Requisitos   [...]                              │
  │    ETAPA 2 — Design [barra atual — accent]             │
  │      └ UX [...]     ◆ Marco (12 jun)                  │
  │      └ UI [...]     ▲ Risco (carga alta)              │
  │  Linha "hoje" vertical — vermelha                      │
  └────────────────────────────────────────────────────────┘
```

**Milestones:** losango (♦) em datas específicas, cor da etapa

**Riscos:** triângulo (▲) com tooltip ao hover, cor warning/danger

---

### 5.3 Tarefas — Kanban (ListaB — escolhida)

**Layout:** colunas kanban agrupadas por etapa

**Views disponíveis (segmented control):** Lista | Kanban* | Gantt

**Kanban cards contêm:**
- Tópico (chip outline)
- Prioridade (PrioChip)
- Nome da tarefa
- Barra de progresso (se em_progresso)
- Rodapé: estimativa (h) + avatar do responsável

**Agrupamento:** por etapa, cada etapa tem seu próprio bloco de kanban com 4 colunas:
`A fazer | Em progresso | Em revisão | Concluída`

**Vista Lista (outline hierárquico):**
Etapa (collapse) → Tópico (collapse) → Tarefa (linha com colunas: nome, responsável, prazo, status, prio, estimativa, progresso)

---

### 5.4 Equipe (EquipeB — cards)

**Layout:** grid 3 colunas de cards por pessoa

**Cada card:**
- Avatar + nome + cargo + skills (chips)
- Barra de carga (% — warning se >85%)
- Métricas: tarefas ativas, concluídas, custo/h
- Sparkline de performance (30d)
- Botões: "Ver perfil" + "Atribuir"

**KPIs no topo:** Pessoas ativas, Carga média, Performance média, Horas/semana

---

### 5.5 Custos (CustosB — burndown)

**Layout:** burndown financeiro SVG + tabela de lançamentos + alertas

**Gráfico burndown SVG:**
- Eixo Y: R$ (120k → 0)
- Eixo X: meses (jan → set)
- Linha ideal (dashed, cinza)
- Linha real (accent, com pontos circulares)
- Projeção (dashed, accent)
- Linha "hoje" (vermelha, com badge "hoje")
- Área preenchida com gradiente abaixo da curva real

**Cards adicionais:**
- Custo/hora por pessoa (barras horizontais com nome, R$/h, horas, total)
- Alertas financeiros (warning/info/success) com botão "Ver"

**Tabela de lançamentos:** data, descrição, etapa, categoria, responsável (avatar), horas, valor

---

### 5.6 Detalhe da Tarefa (TarefaB — hero denso)

**Layout:** topo hero (borderBottom) + conteúdo em grid 2/3 + 1/3

**Hero (topo da página):**
- Breadcrumb: Projeto / Etapa / Tópico / Tarefa
- ID da tarefa (#ZK-127) como chip `mono outline xs`
- Título (h1 grande)
- Chips inline: Status, Prioridade, Prazo, Horas gastas/estimadas, Dependências
- Avatares dos responsáveis (stack)
- Barra de progresso: "PROGRESSO — [bar] — 58% · 3 de 5 subtarefas"

**Coluna esquerda (2/3):**
- Grid 2x3 de propriedades (cards pequenos): Responsável, Revisor, Estimado, Gasto, Etapa/Tópico, Tipo
- Card Descrição (editável)
- Card Subtarefas (checklist com progresso + avatar)
- Card Anexos (mini-cards com ícone e nome)
- Card Comentários (lista + composer)

**Coluna direita (1/3):**
- Card Propriedades (key-value list: todos os campos)
- Card Atividade (log de eventos)

---

### 5.7 Detalhe do Projeto (ProjetoB — grid de cards)

**Layout:** hero com logo do projeto + grid de cards

**Hero:**
- Logo do projeto (64x64, gradiente, letra inicial)
- Nome, cliente (chip), status, PM
- Progresso % (bar horizontal à direita)

**Grid de cards:**
- Etapas (card grande, span 2 linhas): lista de etapas com progresso, datas, avatares
- KPIs ao lado: Orçamento, Prazo final, Tarefas abertas, Equipe ativa
- Equipe alocada: lista com carga
- Próximas entregas: milestones
- Ações rápidas: links para Gantt, Kanban, Custos, etc.

**Tab-bar:** Visão geral* | Tarefas | Gantt | Equipe | Custos | Arquivos | Decisões

---

### 5.8 Relatórios (RelatoriosB — resumo executivo)

**Layout:** documento estilo storyboard, máx 880px, padding confortável

**Estrutura:**
- Número da semana + data + revisor (chips)
- Título grande em destaque (insight principal gerado automaticamente)
- Subtítulo explicando que é gerado a partir de dados reais

**Seções numeradas (01–04):**
- 01: O que aconteceu esta semana (KPIs: concluídas, novas, atrasadas)
- 02: Como está o orçamento (gráfico SVG burndown simples)
- 03: Quem está sobrecarregado (barras de carga)
- 04: Decisões pendentes (lista com prazo + responsável)

**Botão:** Exportar PDF (no topo direito)

---

## 6. Requisitos Funcionais Faltantes

> **ESTES ITENS DEVEM SER IMPLEMENTADOS ANTES DO TRABALHO VISUAL.**
> Organize-os em ordem de prioridade abaixo.

---

### 6.1 [CONCLUÍDO] Membros nomeados / Usuários do sistema
### 6.2 [CONCLUÍDO] Status de tarefa expandido
### 6.3 [CONCLUÍDO] Campos do projeto — budget, cliente, PM, cor
### 6.4 [CONCLUÍDO] Sistema de Custos / Lançamentos
### 6.5 [CONCLUÍDO] Risks (Riscos)
### 6.6 [CONCLUÍDO] Milestones / Marcos
### 6.7 [CONCLUÍDO] Comentários em Subtópico
### 6.8 [CONCLUÍDO] Anexos de Subtópico (Visual implementado)
### 6.9 [CONCLUÍDO] Métricas de carga e performance de membros
### 6.10 [CONCLUÍDO] Decisões do projeto (Visual em relatórios)

---

## 7. Roteiro de Implementação

### Fase 1 — Requisitos funcionais (backend primeiro) [CONCLUÍDA]

1. [x] Criar migration `add_team_members` — modelo `TeamMember` + `SubtopicAssignment`
2. [x] Adicionar campos a `Subtopic`: `spentHours`, `deadline`, `taskType`, `priority`
3. [x] Migrar `status` de subtopic para novo enum
4. [x] Adicionar campos a `Project`: `totalBudget`, `client`, `managerId`, `color`, `endDate`
5. [x] Criar modelo `CostEntry` + migration
6. [x] Criar modelos `Risk`, `Milestone`, `Decision` + migration
7. [x] Criar modelos `SubtopicComment`, `SubtopicAttachment` + migration
8. [x] Implementar serviços + rotas para cada novo modelo
9. [x] Atualizar schemas Zod em `packages/shared`
10. [x] Endpoint `GET /projects/:id/members/metrics`
11. [x] Cobertura de testes de integração para todos os módulos (24 testes)

### Fase 2 — Design system base [CONCLUÍDA]

1. [x] Substituir `apps/web/src/index.css` com todos os tokens desta documentação
2. [x] Adicionar fonte Geist via link no `index.html`
3. [x] Criar `apps/web/src/components/ui/` — componentes reutilizáveis:
   - [x] `Avatar.tsx` / `AvatarStack.tsx`
   - [x] `StatusChip.tsx`
   - [x] `KPI.tsx`
   - [x] `ProgressBar.tsx`
   - [x] `PageHead.tsx`
   - [x] `TabBar.tsx`
   - [x] `Sidebar.tsx` 
   - [x] `Topbar.tsx`
   - [x] `ProgressRing.tsx`
   - [x] `BurndownChart.tsx`

### Fase 3 — Telas [CONCLUÍDA]

1. [x] **Layout shell** — Frame (sidebar + main), Topbar com breadcrumbs
2. [x] **Projeto Detail** (ProjetoB) — hero + grid de cards + tab-bar
3. [x] **Dashboard** (DashboardB) — hero + KPIs + burndown mini
4. [x] **Tarefas Kanban** (ListaB) — kanban agrupado + outline hierárquico
5. [x] **Equipe** (EquipeB) — grid de cards + métricas
6. [x] **Custos** (CustosB) — burndown SVG + tabela + alertas
7. [x] **Detalhe Tarefa** (TarefaB) — hero denso + subtarefas + comentários
8. [x] **Gantt** — swimlanes SVG (sem biblioteca externa para MVP)
9. [x] **Relatórios** (RelatoriosB) — resumo executivo

### Fase 4 — Polimento [PENDENTE]

- [ ] Tema escuro (toggle no sidebar)
- [ ] Cor de acento configurável por projeto
- [ ] Animações de transição (framer-motion ou CSS transitions)
- [ ] Responsividade básica (> 1280px)
- [ ] Empty states com ilustração SVG simples
- [ ] Skeleton loading para listas e tabelas

---

## 8. Convenções de código (manter consistência)

...
