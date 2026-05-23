# Sistema de Gestão de Projetos PMBOK

Plataforma web para gestão completa de projetos baseada nas 10 áreas de conhecimento do PMBOK.
Gerencia custos, equipes, tarefas (Gantt), caminho crítico e documentos.

## Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Estado global**: Zustand
- **Gantt**: DHTMLX Gantt (ou Frappe Gantt)
- **Gráficos**: Recharts + D3.js
- **HTTP**: TanStack Query + Axios
- **Backend**: Node.js 20 + Express + TypeScript
- **Banco**: PostgreSQL 16
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Validação**: Zod (compartilhado entre front e back)
- **Monorepo**: Turborepo (`apps/web`, `apps/api`, `packages/shared`)
- **Deploy**: Railway (PostgreSQL incluso)

## Estrutura do monorepo

```
/
├── apps/
│   ├── web/          # React + Vite
│   └── api/          # Express + Prisma
├── packages/
│   └── shared/       # Tipos Zod, DTOs, utilitários
├── CLAUDE.md
└── PLANNING.md
```

## Módulos principais

1. **Iniciação** — Termo de abertura, objetivos, datas, premissas
2. **Stakeholders & Equipes** — Registro, papéis, RACI, profissionais
3. **Tarefas & Cronograma** — WBS/EAP hierárquico, Gantt interativo, dependências (FS/FF/SS/SF), milestones
4. **Caminho Crítico** — Algoritmo CPM (forward/backward pass), folgas TF/FL, histórico antes/depois
5. **Custos & Orçamento** — Budget por atividade, linha de base, gastos reais, EVM (CPI/SPI/EAC/VAC), S-curve
6. **Recursos** — Humanos (horas, custo/h), físicos (equipamentos, materiais), histograma, detecção de conflito
7. **Documentos** — Upload, categorização, versionamento, vinculação com tarefas
8. **Relatórios** — Dashboard executivo, exportação PDF, dados para apresentação PPTX

## Entidades principais do banco (Prisma)

- `Project` → `Task` (hierárquico, self-relation `parentTaskId`)
- `Task` → `TaskDependency` (predecessor/successor + tipo FS/FF/SS/SF + lag)
- `Project` → `Stakeholder`
- `Project` → `TeamMember` → `User`
- `Project` → `CostItem` (planned_cost, actual_cost, category)
- `Project` → `Resource` (human | physical)
- `Project` → `Document` (versionamento)
- `Project` → `Risk` (probability, impact, response_plan)

## Convenções de código

- Arquivos: `kebab-case` (ex: `task-service.ts`)
- Classes e tipos: `PascalCase`
- Funções e variáveis: `camelCase`
- Rotas da API: REST em `/api/v1/` + substantivos no plural
- Validação: sempre com Zod, schemas em `packages/shared`
- Erros: classe `AppError` com `statusCode` + `message`
- Testes unitários: Vitest; E2E: Cypress

## Algoritmos críticos

### CPM (Caminho Crítico)
- Forward pass: calcula ES (Early Start) e EF (Early Finish)
- Backward pass: calcula LS (Late Start) e LF (Late Finish)
- Folga total: `TF = LS - ES`
- Tarefa crítica: `TF === 0`
- Salvar snapshot do caminho crítico antes de qualquer mudança significativa para comparativo

### EVM (Earned Value Management)
- PV (Planned Value) = orçamento planejado até hoje
- EV (Earned Value) = % concluído × orçamento total
- AC (Actual Cost) = gastos reais até hoje
- CPI = EV / AC (> 1 = abaixo do custo)
- SPI = EV / PV (> 1 = adiantado)
- EAC = BAC / CPI (estimativa no término)
- VAC = BAC - EAC (variação no término)

## Comandos úteis

```bash
# Instalar dependências
pnpm install

# Dev (monorepo completo)
pnpm dev

# Só o frontend
pnpm --filter web dev

# Só o backend
pnpm --filter api dev

# Migrations Prisma
pnpm --filter api prisma migrate dev

# Gerar Prisma Client
pnpm --filter api prisma generate

# Testes
pnpm test
```

## Roadmap de fases

| Fase | Período | Foco |
|------|---------|------|
| 1 | Meses 1–1.5 | Setup, auth, CRUD de projetos |
| 2 | Meses 1.5–4 | Tarefas, WBS, Gantt, dependências |
| 3 | Meses 4–5.5 | CPM, recursos, alocação |
| 4 | Meses 5.5–7 | Custos, EVM, documentos, riscos |
| 5 | Meses 7–8 | Relatórios, exportação, refinamentos |

## Apresentação do projeto (11 slides)

O sistema deve ser capaz de exportar dados para cada um desses slides:

1. Capa — nome, gerente, data
2. Stakeholders, objetivo, data início/fim
3. Elementos do projeto — entregas, Termo de Abertura
4. Equipes e profissionais
5. Recursos humanos e físicos
6. Outros recursos e aquisições
7. Objetivos específicos e macro atividades (WBS)
8. Objetivos com custos + destaque dos mais custosos
9. Justificativa de tempo por atividade + onde o orçamento foi cortado
10. Caminho crítico antes e depois das mudanças
11. Considerações finais — problemas, variáveis externas, lições aprendidas
