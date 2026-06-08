# Blueprint — Guru Cash (revisar ANTES de gravar no GPG)

> Nada foi criado ainda. Este é o desenho que será gravado **só após sua aprovação**.
> Legenda: **CC** = caminho crítico (vai com `priority: high` + token `[CAMINHO_CRITICO]` na descrição) · **∥** = roda em paralelo com a tarefa anterior (`isConcurrent: true`).

---

## 0. Projeto

| Campo | Valor proposto |
|---|---|
| name | **Guru Cash** |
| description | App de gestão financeira pessoal multinacional com Open Finance, multi-moeda, conversão em tempo real e conformidade legal. Lançamento simultâneo em 10 países (BR, EUA, Europa). |
| startDate | 2026-06-08 |
| endDate | 2027-11-30 (≈17 meses) |
| dailyHours | 8 |
| status | active |
| color | #10B981 (verde — "cash") |
| totalBudget | (vazio — você não pediu custos) |

---

## 1. Stakeholders (19)

| # | Nome | Tipo | Papel | Org | Infl. | Inter. | Engajamento |
|---|---|---|---|---|---|---|---|
| 1 | Sponsor / CFO | internal | Patrocinador, go/no-go | Guru Cash | 5 | 5 | leading |
| 2 | Gerente de Projeto (PMO) | internal | Prazo/escopo/orçamento | Guru Cash | 4 | 5 | leading |
| 3 | Product Owners | internal | Priorização do backlog | Guru Cash | 4 | 5 | supportive |
| 4 | Arquiteto / Tech Lead | internal | Decisões técnicas | Guru Cash | 4 | 5 | supportive |
| 5 | CISO / Segurança | internal | Segurança de dados | Guru Cash | 4 | 5 | supportive |
| 6 | DPO (Encarregado de Dados) | internal | LGPD/GDPR | Guru Cash | 3 | 5 | supportive |
| 7 | Compliance / Jurídico | internal | Regras regulatórias | Guru Cash | 4 | 4 | supportive |
| 8 | Customer Success / Suporte | internal | Adoção/retenção | Guru Cash | 2 | 4 | neutral |
| 9 | Usuários finais (10 países) | external | Experiência/confiança | — | 3 | 5 | neutral |
| 10 | Instituições financeiras / bancos | external | Provedores de API | — | 3 | 3 | neutral |
| 11 | Agregadores Open Finance | external | Belvo/Plaid/TrueLayer | — | 3 | 4 | supportive |
| 12 | Provedores de câmbio (FX) | external | Cotações em tempo real | — | 2 | 3 | neutral |
| 13 | Parceiros KYC/AML | external | Onfido/Jumio | — | 2 | 3 | supportive |
| 14 | Cloud Provider | external | AWS/GCP | — | 2 | 3 | neutral |
| 15 | BACEN | external | Regulador BR | Banco Central | 5 | 3 | neutral |
| 16 | ANPD | external | LGPD | ANPD | 5 | 3 | neutral |
| 17 | Reguladores EUA | external | CFPB/FinCEN/SEC | — | 5 | 2 | neutral |
| 18 | Reguladores EU | external | EBA/PSD2/DPAs | — | 5 | 2 | neutral |
| 19 | Auditores externos | external | SOC 2 / ISO 27001 | — | 3 | 2 | neutral |

---

## 2. Squads (10 equipes) e Profissionais (18)

**Equipes:** Open Finance · FX & Tax Engine · Core Financeiro · Apps Cliente · Plataforma/SRE · Segurança · Compliance & Localização · Dados & Insights · PMO/Gestão · Design/UX

| Profissional | Iniciais | Cargo | R$/h | Skills | Equipe |
|---|---|---|---|---|---|
| Tech Lead / Arquiteto | TL | Arquiteto de Software | 180 | Arquitetura, AWS, Kafka | Plataforma/SRE |
| Eng. Plataforma | DO | DevOps | 150 | K8s, Terraform, CI/CD | Plataforma/SRE |
| SRE | SR | SRE | 140 | SRE, Observabilidade | Plataforma/SRE |
| Dev Backend (Open Finance) | BO | Backend Sr | 130 | Node, Go, APIs | Open Finance |
| Dev Backend (FX) | BF | Backend Sr | 130 | Go, PostgreSQL | FX & Tax Engine |
| Dev Backend (Core) | BC | Backend | 110 | Node, TS | Core Financeiro |
| Dev Mobile | MB | Mobile | 120 | React Native | Apps Cliente |
| Dev Frontend | FE | Frontend | 110 | React, TS | Apps Cliente |
| QA Automation | QA | QA | 90 | Cypress, Vitest | Apps Cliente |
| UX/UI Designer | UX | Designer | 100 | Figma, Design System | Design/UX |
| AppSec Engineer | AS | AppSec | 160 | Pentest, OWASP | Segurança |
| CISO | CS | CISO | 200 | Segurança, ISO 27001 | Segurança |
| DPO / Compliance | CP | DPO | 170 | LGPD, GDPR | Compliance & Localização |
| Analista Fiscal | AF | Tributação intl. | 120 | Impostos multi-país | FX & Tax Engine |
| Data Engineer | DE | Data Eng | 130 | Kafka, BigQuery | Dados & Insights |
| ML Engineer | ML | ML Eng | 140 | ML, Python | Dados & Insights |
| Product Owner | PO | PO | 140 | Produto, Discovery | PMO/Gestão |
| Gerente de Projeto | GP | GP | 160 | PMO, PMBOK | PMO/Gestão |

---

## 3. EAP — Etapas → Tópicos → Subtarefas (48 tarefas)

### F0 — Discovery & Fundação
**T1.1 Discovery & Arquitetura**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Workshop de descoberta e requisitos | 24 | **CC** | PMO/Gestão |
| 2 | Definição da arquitetura alvo | 40 | **CC** | Plataforma/SRE |
| 3 | Avaliação inicial de compliance | 24 | ∥ | Compliance & Localização |
| 4 | Seleção de agregadores Open Finance | 16 | ∥ | Open Finance |

**T1.2 Fundação de Infraestrutura**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Provisionar cloud + IaC base | 40 | **CC** | Plataforma/SRE |
| 2 | Configurar Kubernetes multi-ambiente | 40 | **CC** | Plataforma/SRE |
| 3 | Pipeline CI/CD | 32 | ∥ | Plataforma/SRE |
| 4 | Observabilidade base | 24 | ∥ | Plataforma/SRE |

**T1.3 Baseline de Segurança**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Gestão de segredos (Vault/KMS) | 24 | ∥ | Segurança |
| 2 | Criptografia e tokenização | 24 | ∥ | Segurança |
| 3 | Modelo de identidade / OAuth2 | 32 | **CC** | Segurança |

### F1 — MVP Brasil
**T2.1 Identidade & Onboarding**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Autenticação + MFA | 40 | **CC** | Core Financeiro |
| 2 | Fluxo KYC/AML | 40 | ∥ | Compliance & Localização |
| 3 | Gestão de consentimento | 24 | ∥ | Compliance & Localização |

**T2.2 Integração Open Finance (BACEN)**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Conector Belvo/BACEN | 56 | **CC** | Open Finance |
| 2 | Motor de sincronização de contas | 48 | **CC** | Open Finance |
| 3 | Agregação e normalização de transações | 40 | ∥ | Core Financeiro |

**T2.3 Motor de Câmbio & Tributação**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Serviço de cotações FX (tempo real) | 40 | **CC** | FX & Tax Engine |
| 2 | Conversão multi-moeda idempotente | 40 | **CC** | FX & Tax Engine |
| 3 | Regras tributárias BR | 32 | ∥ | FX & Tax Engine |

**T2.4 Núcleo Financeiro & App**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Consolidação de saldos | 32 | ∥ | Core Financeiro |
| 2 | Categorização de despesas | 32 | ∥ | Dados & Insights |
| 3 | Dashboard mobile/web | 56 | **CC** | Apps Cliente |
| 4 | Orçamento e metas | 32 | ∥ | Apps Cliente |

**T2.5 Qualidade**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Testes automatizados E2E | 32 | ∥ | Apps Cliente |
| 2 | UAT MVP Brasil | 24 | **CC** | PMO/Gestão |

### F2 — Hardening & Certificações
**T3.1 Segurança & Auditoria**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Pentest e correções | 40 | **CC** | Segurança |
| 2 | Preparação SOC 2 / ISO 27001 | 48 | ∥ | Segurança |
| 3 | DPIA / conformidade LGPD | 32 | ∥ | Compliance & Localização |

**T3.2 Confiabilidade**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Testes de carga e tuning | 32 | **CC** | Plataforma/SRE |
| 2 | Disaster Recovery / multi-AZ | 32 | ∥ | Plataforma/SRE |
| 3 | Monitoramento e alertas | 24 | ∥ | Plataforma/SRE |

### F3 — Expansão EUA
**T4.1 Integração EUA**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Conector Plaid | 48 | **CC** | Open Finance |
| 2 | Regras fiscais/tributárias US | 40 | ∥ | FX & Tax Engine |

**T4.2 Localização & Compliance EUA**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | i18n en-US (data/moeda) | 24 | ∥ | Apps Cliente |
| 2 | Compliance US (CFPB/FinCEN) | 32 | **CC** | Compliance & Localização |
| 3 | UAT EUA | 24 | **CC** | PMO/Gestão |

### F4 — Expansão Europa
**T5.1 Integração Europa**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Conector TrueLayer/Tink (PSD2) | 56 | **CC** | Open Finance |
| 2 | Regras fiscais multi-país EU | 48 | ∥ | FX & Tax Engine |

**T5.2 Localização & GDPR**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | i18n múltiplos idiomas EU | 40 | ∥ | Apps Cliente |
| 2 | Conformidade GDPR + DPAs | 40 | **CC** | Compliance & Localização |
| 3 | UAT Europa | 24 | **CC** | PMO/Gestão |

### F5 — Lançamento Global
**T6.1 Escala & Operação**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Otimização de performance multi-região | 40 | **CC** | Plataforma/SRE |
| 2 | Suporte 24/7 e runbooks | 24 | ∥ | Plataforma/SRE |
| 3 | Go-live global / rollout 10 países | 40 | **CC** | PMO/Gestão |

**T6.2 Pós-lançamento**
| # | Tarefa | h | Flag | Equipe |
|---|---|---|---|---|
| 1 | Monitoramento de adoção e insights | 24 | ∥ | Dados & Insights |
| 2 | Retrospectiva e lições aprendidas | 16 | ∥ | PMO/Gestão |

**Resumo:** 6 etapas · 16 tópicos · 48 tarefas · **22 no caminho crítico** · 26 em paralelo.

---

## 4. Marcos (Milestones)

| Marco | Data aprox. |
|---|---|
| M1 — Fundação concluída | 2026-08-07 |
| M2 — MVP Brasil (GA Brasil) | 2026-12-15 |
| M3 — Certificações (SOC 2 / ISO) | 2027-02-15 |
| M4 — Beta EUA | 2027-05-15 |
| M5 — Beta Europa | 2027-08-15 |
| M6 — GA Global (10 países) | 2027-11-15 |

---

## 5. Riscos (7)

| Título | Prob. | Impacto | Plano de resposta |
|---|---|---|---|
| Não conformidade LGPD/GDPR/PSD2 | med | high | DPO, privacy by design, jurídico por região, DPIA |
| Vazamento de dados financeiros | low | high | Criptografia, tokenização, pentest, bug bounty, SOC 2 |
| Instabilidade de APIs bancárias | high | high | Agregadores, retries, circuit breaker, fallback |
| Inconsistência na conversão de moeda | med | high | Fonte FX confiável, idempotência, reconciliação |
| Regras fiscais variadas por país | high | high | Motor de regras configurável + consultoria local |
| Escalabilidade / alta concorrência | med | high | Event-driven, load testing, auto-scaling |
| Fraude / AML | med | high | KYC, monitoramento transacional, scoring |
