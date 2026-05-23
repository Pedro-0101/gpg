# Planejamento — Sistema de Gestão de Projetos PMBOK

## Visão geral

Plataforma web desenvolvida por um desenvolvedor solo usando React + Node.js para gerenciar projetos baseados no PMBOK. Cobre as 10 áreas de conhecimento com foco em Gantt, caminho crítico e custos.

---

## Áreas do PMBOK cobertas

| Área | O que o sistema gerencia |
|------|--------------------------|
| Integração | Termo de abertura, controle de mudanças |
| Escopo | WBS/EAP, entregas, controle de escopo |
| Cronograma | Gantt, dependências, caminho crítico (CPM) |
| Custos | Orçamento, gastos reais, EVM |
| Recursos | Equipes, recursos físicos, histograma de alocação |
| Comunicação | Documentos, relatórios, notificações |
| Riscos | Registro, probabilidade, impacto, plano de resposta |
| Aquisições | Contratos, fornecedores, materiais |
| Stakeholders | Registro, engajamento, matriz poder/interesse |
| Qualidade | Critérios de aceite, checklists por entrega |

---

## Stack tecnológica

### Frontend (`apps/web`)
| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| UI Framework | React 18 + TypeScript | Componentes reativos, tipagem forte |
| Roteamento | React Router v6 | SPA com rotas aninhadas |
| Estado global | Zustand | Simples para dev solo |
| Estilização | Tailwind CSS + shadcn/ui | Produtividade máxima |
| Gantt | DHTMLX Gantt (ou Frappe) | Maduro, suporta dependências complexas |
| Gráficos | Recharts + D3.js | S-curve, EVM, histogramas |
| HTTP | TanStack Query + Axios | Cache automático, loading states |
| Exportação PDF | jsPDF + html2canvas | Relatórios e slides |

### Backend (`apps/api`)
| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Runtime | Node.js 20 LTS | Mesmo ecossistema JS |
| Framework | Express.js + TypeScript | Simples e flexível |
| Banco | PostgreSQL 16 | Relacional, confiável, bom com datas |
| ORM | Prisma | Migrations, queries type-safe |
| Autenticação | JWT + bcrypt | Stateless, simples |
| Validação | Zod | Schema compartilhado com frontend |
| Upload | Multer + Cloudinary ou S3 | Documentos do projeto |
| Deploy | Railway | Free tier + PostgreSQL incluso |

### Dev & Qualidade
| Ferramenta | Uso |
|-----------|-----|
| Turborepo | Monorepo: web + api + shared |
| ESLint + Prettier | Código consistente |
| Vitest | Testes unitários (especialmente CPM e EVM) |
| Cypress | Testes E2E |
| Swagger/OpenAPI | Documentação da API |
| Git + GitHub Actions | CI/CD básico |

---

## Modelo de dados (Prisma Schema)

### Entidades principais e relacionamentos

```
Project
  ├── Task[] (hierárquico via parentTaskId)
  │     └── TaskDependency[] (predecessor/successor)
  ├── Stakeholder[]
  ├── TeamMember[] → User
  ├── CostItem[]
  ├── Resource[]
  ├── Document[]
  └── Risk[]
```

### Campos por entidade

**Project**
- id, name, description
- start_date, end_date, status, priority
- budget_planned, budget_baseline
- created_by → User

**Task**
- id, project_id, parent_task_id (self-relation)
- name, description, wbs_code
- start_date, end_date, duration_days
- progress (0–100), status, priority
- is_milestone, is_critical (calculado pelo CPM)
- early_start, early_finish, late_start, late_finish, float (CPM)
- assigned_to → TeamMember

**TaskDependency**
- predecessor_id → Task
- successor_id → Task
- type: FS | FF | SS | SF
- lag_days

**Stakeholder**
- project_id, name, role, organization
- type: internal | external
- influence (1–5), interest (1–5)
- engagement_level: unaware | resistant | neutral | supportive | leading
- contact_info

**TeamMember**
- project_id, user_id → User
- role, profession
- hourly_rate, availability_percent
- start_date, end_date

**CostItem**
- project_id, task_id (nullable)
- category: human | physical | other
- description, planned_cost, actual_cost, date

**Resource**
- project_id, name
- type: human | physical
- unit_cost, quantity, availability

**Document**
- project_id, task_id (nullable)
- title, category, version
- file_path, file_type, file_size
- uploaded_by → User

**Risk**
- project_id, description
- probability (1–5), impact (1–5)
- score = probability × impact
- response_plan, owner → TeamMember
- status: identified | analyzing | planned | monitored | closed

---

## Algoritmos críticos

### CPM — Forward & Backward Pass

```typescript
// Forward pass
function forwardPass(tasks: Task[]): void {
  // Ordenar por dependências (topological sort)
  const sorted = topologicalSort(tasks);
  for (const task of sorted) {
    const preds = getPredecessors(task);
    task.earlyStart = preds.length === 0
      ? projectStartDate
      : Math.max(...preds.map(p => p.earlyFinish + lag));
    task.earlyFinish = task.earlyStart + task.duration;
  }
}

// Backward pass
function backwardPass(tasks: Task[]): void {
  const sorted = topologicalSort(tasks).reverse();
  for (const task of sorted) {
    const succs = getSuccessors(task);
    task.lateFinish = succs.length === 0
      ? projectEndDate
      : Math.min(...succs.map(s => s.lateStart - lag));
    task.lateStart = task.lateFinish - task.duration;
    task.totalFloat = task.lateStart - task.earlyStart;
    task.isCritical = task.totalFloat === 0;
  }
}
```

### EVM — Earned Value Management

```typescript
function calculateEVM(project: Project, today: Date) {
  const BAC = project.budget_planned;
  const PV  = calcPlannedValue(project, today);   // % planejado × BAC
  const EV  = calcEarnedValue(project, today);    // % concluído × BAC
  const AC  = calcActualCost(project, today);     // soma gastos reais

  return {
    CPI: EV / AC,           // Cost Performance Index
    SPI: EV / PV,           // Schedule Performance Index
    CV:  EV - AC,           // Cost Variance
    SV:  EV - PV,           // Schedule Variance
    EAC: BAC / (EV / AC),   // Estimate at Completion
    ETC: (BAC - EV) / (EV / AC), // Estimate to Complete
    VAC: BAC - (BAC / (EV / AC)), // Variance at Completion
  };
}
```

---

## Roadmap de desenvolvimento

### Fase 1 — Fundação & Auth (Meses 1–1.5)
- [ ] Setup Turborepo (apps/web, apps/api, packages/shared)
- [ ] Schema Prisma com entidades principais
- [ ] Auth: registro, login, JWT, refresh token
- [ ] CRUD completo de projetos
- [ ] Dashboard básico
- [ ] CI básico no GitHub Actions

### Fase 2 — Tarefas, WBS & Gantt (Meses 1.5–4)
- [ ] CRUD de tarefas com hierarquia (WBS)
- [ ] Sistema de dependências entre tarefas
- [ ] Integração do DHTMLX Gantt
- [ ] Cálculo automático de datas
- [ ] Milestones e marcos
- [ ] CRUD de stakeholders
- [ ] CRUD de equipes e membros
- [ ] Termo de abertura

### Fase 3 — Caminho Crítico & Recursos (Meses 4–5.5)
- [ ] Algoritmo CPM (topological sort + forward/backward pass)
- [ ] Highlight do caminho crítico no Gantt
- [ ] Folgas por tarefa (TF, FL)
- [ ] Snapshot automático antes de mudanças (para comparativo)
- [ ] CRUD de recursos humanos e físicos
- [ ] Histograma de recursos
- [ ] Detecção de conflito de alocação

### Fase 4 — Custos, EVM & Documentos (Meses 5.5–7)
- [ ] Orçamento por atividade e categoria
- [ ] Linha de base de custos (baseline)
- [ ] Lançamento de custos reais
- [ ] Cálculo EVM (CPI, SPI, EAC, VAC)
- [ ] Gráfico S-curve (PV × EV × AC ao longo do tempo)
- [ ] Upload e gestão de documentos (Multer + S3/Cloudinary)
- [ ] Versionamento de documentos
- [ ] Registro e monitoramento de riscos

### Fase 5 — Relatórios & Exportação (Meses 7–8)
- [ ] Dashboard executivo com KPIs
- [ ] Relatório de desempenho (PDF)
- [ ] Exportação de dados para os 11 slides da apresentação
- [ ] Histórico de mudanças e registro de variáveis externas
- [ ] Refinamentos de UX
- [ ] Testes E2E com Cypress

---

## Estrutura da apresentação (11 slides)

Cada slide tem um módulo correspondente que exporta os dados:

| Slide | Título | Módulo que fornece os dados |
|-------|--------|---------------------------|
| 1 | Capa do projeto | Dados básicos do projeto |
| 2 | Stakeholders, objetivo, datas | Módulo Iniciação + Stakeholders |
| 3 | Elementos — entregas, Termo de Abertura | Módulo Iniciação |
| 4 | Equipes e profissionais | Módulo Recursos (TeamMember) |
| 5 | Recursos humanos e físicos | Módulo Recursos |
| 6 | Outros recursos e aquisições | Módulo Recursos (tipo: other) |
| 7 | Objetivos e macro atividades | Módulo Tarefas (WBS nível 1–2) |
| 8 | Objetivos com custos (+ destaques) | Módulo Custos + WBS |
| 9 | Justificativa de tempo e cortes de orçamento | EVM + histórico de mudanças |
| 10 | Caminho crítico antes e depois | Módulo CPM (snapshots) |
| 11 | Considerações finais | Registro de mudanças + lições aprendidas |

---

## Convenções de código

### Nomenclatura
- Arquivos: `kebab-case` → `task-service.ts`, `gantt-view.tsx`
- Classes e tipos: `PascalCase` → `TaskService`, `ProjectDto`
- Funções e variáveis: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`

### Estrutura de pastas (api)
```
apps/api/src/
  ├── modules/
  │   ├── projects/
  │   │   ├── projects.routes.ts
  │   │   ├── projects.controller.ts
  │   │   ├── projects.service.ts
  │   │   └── projects.schema.ts  (Zod)
  │   ├── tasks/
  │   ├── costs/
  │   └── ...
  ├── middleware/
  │   ├── auth.middleware.ts
  │   └── error.middleware.ts
  ├── lib/
  │   ├── prisma.ts
  │   └── jwt.ts
  └── app.ts
```

### Estrutura de pastas (web)
```
apps/web/src/
  ├── pages/
  ├── components/
  │   ├── ui/          (shadcn/ui)
  │   ├── gantt/
  │   ├── costs/
  │   └── ...
  ├── hooks/
  ├── stores/          (Zustand)
  ├── api/             (TanStack Query hooks)
  └── lib/
```

### Rotas da API
```
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id

GET    /api/v1/projects/:id/tasks
POST   /api/v1/projects/:id/tasks
GET    /api/v1/projects/:id/critical-path
GET    /api/v1/projects/:id/evm
GET    /api/v1/projects/:id/export/presentation
```

### Tratamento de erros
```typescript
// Sempre usar AppError
throw new AppError(404, 'Projeto não encontrado');

// Middleware global no Express
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Erro interno do servidor' });
});
```
