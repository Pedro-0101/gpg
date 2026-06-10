# Guru Cash — Resumo Completo do Projeto
> Documento de referência para apresentação acadêmica · Atualizado em 08/06/2026

---

## 1. Visão Geral

| Campo | Valor |
|---|---|
| **Nome** | Guru Cash |
| **Descrição** | App de gestão financeira pessoal multinacional com Open Finance, multi-moeda, conversão em tempo real e conformidade legal |
| **Objetivo de negócio** | Lançamento simultâneo em 10 países, operando inicialmente em Brasil, EUA e Europa |
| **Status** | Ativo — 98% concluído (46 de 47 tarefas) |
| **Início** | 22/Abr/2024 |
| **Fim previsto** | 22/Jun/2026 |
| **Duração total** | ~26 meses |

### Orçamento

| Tipo | Valor |
|---|---|
| Orçamento de pessoal previsto (tarefas) | R$ 1.408.320 |
| Custo de pessoal realizado | R$ 1.370.520 |
| Saldo de pessoal | R$ 37.800 (projeto veio abaixo do orçamento) |
| Lançamentos manuais (infra, ferramentas, consultoria) | R$ 1.091.500 |
| **Custo total do projeto** | **R$ 2.461.820** |

---

## 2. Stakeholders (19)

### Internos

| Nome | Papel | Influência | Interesse | Engajamento |
|---|---|---|---|---|
| Sponsor / CFO | Patrocinador — go/no-go | 5 | 5 | Liderando |
| Gerente de Projeto (PMO) | Gestão de prazo, escopo e orçamento | 4 | 5 | Liderando |
| Product Owners | Priorização do backlog | 4 | 5 | Apoiando |
| Arquiteto / Tech Lead | Decisões técnicas | 4 | 5 | Apoiando |
| CISO / Segurança | Segurança da informação | 4 | 5 | Apoiando |
| Compliance / Jurídico | Conformidade regulatória | 4 | 4 | Apoiando |
| DPO (Encarregado de Dados) | Proteção de dados LGPD/GDPR | 3 | 5 | Apoiando |
| Customer Success / Suporte | Adoção e retenção | 2 | 4 | Neutro |

### Externos

| Nome | Papel | Influência | Interesse | Engajamento |
|---|---|---|---|---|
| BACEN | Regulador — Brasil | 5 | 3 | Neutro |
| ANPD | Autoridade de proteção de dados (LGPD) | 5 | 3 | Neutro |
| Reguladores EUA | CFPB / FinCEN / SEC | 5 | 2 | Neutro |
| Reguladores EU | EBA / PSD2 / DPAs (GDPR) | 5 | 2 | Neutro |
| Auditores externos | SOC 2 / ISO 27001 | 3 | 2 | Neutro |
| Instituições financeiras / bancos | Provedores de API Open Finance | 3 | 3 | Neutro |
| Agregadores Open Finance | Belvo / Plaid / TrueLayer | 3 | 4 | Apoiando |
| Parceiros KYC/AML | Onfido / Jumio | 2 | 3 | Apoiando |
| Provedores de câmbio (FX) | Cotações em tempo real | 2 | 3 | Neutro |
| Cloud Provider | AWS / GCP | 2 | 3 | Neutro |
| Usuários finais (10 países) | Consumidores do app | 3 | 5 | Neutro |

---

## 3. Equipes e Profissionais (12 squads · 23 profissionais)

### Squad 1 — Plataforma / SRE
| Campo | Detalhe |
|---|---|
| **Profissionais** | Tech Lead/Arquiteto (R$180/h) · Eng. Plataforma (R$150/h) · Eng. SRE (R$140/h) |
| **Custo/h** | R$ 470/h |
| **Responsabilidades** | Definição e evolução da arquitetura do sistema; provisionamento e manutenção da infraestrutura em nuvem (AWS/GCP); pipelines CI/CD; orquestração de containers com Kubernetes multi-região; SLAs de disponibilidade (99,9%); resposta a incidentes 24/7 |

### Squad 2 — Segurança (SecOps)
| Campo | Detalhe |
|---|---|
| **Profissionais** | CISO (R$200/h) · AppSec Engineer (R$160/h) |
| **Custo/h** | R$ 360/h |
| **Responsabilidades** | Política de segurança da informação; criptografia em repouso e em trânsito; gestão de segredos (Vault/KMS); pentest e remediação de vulnerabilidades; programa de bug bounty; liderança nas certificações SOC 2 e ISO 27001; revisão de código sob a ótica de segurança (AppSec) |

### Squad 3 — PMO / Gestão
| Campo | Detalhe |
|---|---|
| **Profissionais** | Gerente de Projeto (R$160/h) · Product Owner (R$140/h) |
| **Custo/h** | R$ 300/h |
| **Responsabilidades** | Planejamento e controle de prazo, escopo e orçamento (PMBOK); gestão de riscos e decisões formais; priorização do backlog de produto; cerimônias ágeis (sprint planning, review, retrospectiva); comunicação com stakeholders e board; gestão de mudanças |

### Squad 4 — Apps Cliente
| Campo | Detalhe |
|---|---|
| **Profissionais** | Dev Mobile React Native (R$120/h) · Dev Frontend React (R$110/h) · QA Automation (R$90/h) |
| **Custo/h** | R$ 320/h |
| **Responsabilidades** | Desenvolvimento do app mobile (iOS e Android) em React Native; frontend web em React; testes automatizados E2E (Cypress/Detox); garantia de qualidade e regressão antes de cada release; compatibilidade e acessibilidade em múltiplas plataformas |

### Squad 5 — Dados & Insights
| Campo | Detalhe |
|---|---|
| **Profissionais** | Data Engineer (R$130/h) · ML Engineer (R$140/h) |
| **Custo/h** | R$ 270/h |
| **Responsabilidades** | Pipelines de ingestão e transformação de dados financeiros; treinamento e deployment de modelo de ML para categorização automática de transações; dashboards de métricas de produto (DAU, MAU, NPS, CPI/SPI); geração de insights financeiros personalizados para o usuário |

### Squad 6 — FX & Tax Engine
| Campo | Detalhe |
|---|---|
| **Profissionais** | Dev Backend FX/Go (R$130/h) · Analista Fiscal (R$120/h) |
| **Custo/h** | R$ 250/h |
| **Responsabilidades** | Serviço de cotações de câmbio em tempo real (multi-fonte); motor de conversão multi-moeda idempotente; aplicação de regras tributárias por jurisdição (IOF, FATCA, IVA, withholding tax); cálculo de impostos sobre transações internacionais; engine configurável de regras fiscais por país |

### Squad 7 — Compliance & Localização
| Campo | Detalhe |
|---|---|
| **Profissionais** | DPO / Compliance (R$170/h) |
| **Custo/h** | R$ 170/h |
| **Responsabilidades** | Conformidade com LGPD, GDPR, PSD2 e regulamentações locais de cada país; Data Protection Impact Assessments (DPIA); gestão de consentimentos e direitos dos titulares de dados; localização do produto (i18n — datas, moedas, idiomas, formatos regionais); interface com reguladores e autoridades de proteção de dados (ANPD, DPAs) |

### Squad 8 — Open Finance
| Campo | Detalhe |
|---|---|
| **Profissionais** | Dev Backend Open Finance (R$130/h) |
| **Custo/h** | R$ 130/h |
| **Responsabilidades** | Integração com agregadores Open Finance (Belvo/BR, Plaid/EUA, TrueLayer/EU); normalização de transações de múltiplas instituições financeiras; motor de sincronização de contas com idempotência; gestão de consentimentos bancários via OAuth2; resiliência a falhas de APIs bancárias (circuit breaker, retry, fallback) |

### Squad 9 — Core Financeiro
| Campo | Detalhe |
|---|---|
| **Profissionais** | Dev Backend Core (R$110/h) |
| **Custo/h** | R$ 110/h |
| **Responsabilidades** | Serviços de negócio principais: consolidação de saldos multi-conta e multi-moeda; módulo de orçamento e metas financeiras; categorização e classificação de despesas; APIs de backend consumidas pelo app mobile e web; integridade e consistência dos dados financeiros do usuário |

### Squad 10 — Design / UX
| Campo | Detalhe |
|---|---|
| **Profissionais** | UX/UI Designer Figma (R$100/h) |
| **Custo/h** | R$ 100/h |
| **Responsabilidades** | Pesquisa com usuários e mapeamento de jornadas; design system global reutilizável por todas as telas; prototipagem e testes de usabilidade; adaptação visual para diferentes culturas e mercados (design localizado); handoff de especificações para as squads de desenvolvimento |

### Squad 11 — Marketing & Lançamento
| Campo | Detalhe |
|---|---|
| **Profissionais** | Digital Marketing Manager (R$130/h) · Growth Hacker (R$110/h) · Copywriter/Localização (R$80/h) |
| **Custo/h** | R$ 320/h |
| **Responsabilidades** | Posicionamento de marca e estratégia de go-to-market por região; planejamento e execução de campanhas de aquisição paga (Google, Meta, ASO); benchmarking competitivo e pesquisa de mercado por país; conteúdo localizado em múltiplos idiomas; monitoramento de métricas de aquisição (CAC, DAU/MAU, funil de conversão) pós-lançamento |

### Squad 12 — Suporte & Customer Success
| Campo | Detalhe |
|---|---|
| **Profissionais** | Head de Suporte (R$120/h) · Customer Success Lead (R$100/h) |
| **Custo/h** | R$ 220/h |
| **Responsabilidades** | Estruturação de canais de atendimento (chat, e-mail, telefone), SLAs e base de conhecimento; criação de playbooks e FAQs multi-idioma; treinamento da equipe de suporte para produto financeiro; cobertura 24/7 nos primeiros 30 dias pós-lançamento global; coleta e análise de NPS, reviews nas lojas e entrevistas com early adopters para retroalimentar o produto |

### Resumo — custo/hora total das equipes

| Squad | Custo/h |
|---|---|
| Plataforma / SRE | R$ 470/h |
| Segurança | R$ 360/h |
| PMO / Gestão | R$ 300/h |
| Apps Cliente | R$ 320/h |
| Marketing & Lançamento | R$ 320/h |
| Dados & Insights | R$ 270/h |
| FX & Tax Engine | R$ 250/h |
| Suporte & Customer Success | R$ 220/h |
| Compliance & Localização | R$ 170/h |
| Open Finance | R$ 130/h |
| Core Financeiro | R$ 110/h |
| Design / UX | R$ 100/h |
| **Total (todas as squads simultâneas)** | **R$ 3.020/h** |

---

## 4. EAP — Estrutura Analítica do Projeto com Narrativa

> Esta seção conta a história do projeto fase a fase, explicando o raciocínio por trás de cada decisão, a ordem das tarefas e o que tornou cada atividade crítica para o sucesso do Guru Cash.

---

### F0 — Discovery & Fundação
**Período:** 22/Abr/2024 → 16/Set/2024 · **Status:** Concluído

#### A história desta fase

Antes de escrever uma única linha de código, o time do Guru Cash precisava responder três perguntas fundamentais: *O que exatamente vamos construir? Como vamos construir? E em qual infraestrutura isso vai rodar?*

O projeto nasceu de uma ambição grande — operar em 10 países simultaneamente — e ambição sem planejamento vira caos. Por isso, a primeira fase foi inteiramente dedicada a construir a fundação sobre a qual tudo mais seria apoiado.

---

**Tópico 1 — Discovery & Arquitetura**

O projeto começa com três tarefas que acontecem quase em paralelo, porque todas alimentam a próxima decisão.

> **Avaliação inicial de compliance** *(72h planejadas / 89h realizadas)*
> A primeira coisa que o DPO fez foi mapear o que a LGPD, o GDPR e o PSD2 exigem de um app financeiro multinacional. Essa tarefa veio primeiro porque a arquitetura do sistema *precisa* ser projetada já com as restrições legais em mente — é muito mais caro corrigir depois. Descobriu-se, por exemplo, que dados de usuários europeus não podem sair da UE, o que impactou diretamente as decisões de infraestrutura.

> **Seleção de agregadores Open Finance** *(48h / 56h)*
> Simultaneamente, o time técnico avaliou como se conectar às centenas de bancos nos 10 países-alvo. Dois caminhos: integrar diretamente com cada banco (barato por banco, mas inviável em escala) ou usar agregadores especializados (Belvo para Brasil, Plaid para EUA, TrueLayer para Europa). A decisão foi pelos agregadores — redução de 18+ meses no prazo de desenvolvimento. Essa escolha precisava estar definida antes da arquitetura, pois ditou como o sistema receberia dados bancários.

> **Workshop de descoberta e requisitos** *(72h / 87h)* · **Caminho crítico**
> Com o panorama legal e a estratégia de integração definidos, o PMO reuniu todas as áreas num workshop estruturado para documentar os requisitos do produto. Esta tarefa é **crítica** porque nenhuma decisão de arquitetura pode ser tomada sem saber o que o sistema precisa fazer. Durou mais do que o planejado (+21%) porque surfaram requisitos não mapeados — como suporte a criptomoedas e carteiras digitais, que foram descartados para não inflar o escopo do MVP.

> **Definição da arquitetura alvo** *(120h / 141h)* · **Caminho crítico**
> Com todos os insumos em mãos, o Tech Lead desenhou a arquitetura. A decisão mais importante aqui foi adotar **event-driven com Kafka** em vez de uma API síncrona tradicional. O raciocínio: se um banco cair, o app não pode cair junto. Com mensageria assíncrona, a falha de um componente não derruba os outros. Esta tarefa é **crítica** porque todas as squads dependem dela para saber como seus serviços se comunicam entre si. Tomou mais tempo (+17%) por causa da complexidade do desenho multi-região.

> **Pesquisa de mercado e benchmarking competitivo** *(80h / 92h)* ·  concomitante · prioridade baixa
> Enquanto as decisões técnicas e legais tomavam forma, o squad de Marketing mapeou o cenário competitivo nos 10 mercados-alvo — análise de TAM/SAM/SOM, benchmarking com Revolut, Wise, Nubank e concorrentes locais, e primeiros sinais de posicionamento do produto. Atividade concomitante ao discovery técnico; não bloqueia nenhuma outra entrega, mas alimenta as decisões de produto do F1 em diante.

---

**Tópico 2 — Fundação de Infraestrutura**

Com a arquitetura definida, o time de Plataforma/SRE assumiu o palco. A lógica aqui é simples: não adianta desenvolver software sem ter onde rodá-lo.

> **Pipeline CI/CD** *(96h / 104h)*
> A primeira entrega da infraestrutura foi o pipeline de integração e entrega contínua. Isso parece detalhe técnico, mas é estratégico: sem CI/CD, cada deploy é manual e arriscado. Com ele, qualquer desenvolvedor pode subir código com segurança. Veio antes do provisionamento de nuvem porque o pipeline precisa existir para automatizar o próprio provisionamento.

> **Provisionar cloud + IaC base** *(120h / 129h)* · **Caminho crítico**
> Com o pipeline pronto, o time provisionou toda a infraestrutura base em AWS/GCP usando Terraform (Infrastructure as Code). Isso é **crítico** porque sem ambiente de desenvolvimento nenhuma outra squad consegue trabalhar. O IaC garante que os ambientes de dev, staging e produção sejam idênticos — eliminando o clássico "funciona na minha máquina".

> **Observabilidade base** *(72h / 63h)*
> Em paralelo, o SRE configurou logs, métricas e rastreamento distribuído. Um sistema financeiro sem observabilidade é como dirigir vendado — você só descobre que algo errou depois que o cliente reclama.

> **Configurar Kubernetes multi-ambiente** *(120h / 137h)* · **Caminho crítico**
> O passo final da infraestrutura foi configurar os clusters Kubernetes para suportar múltiplos ambientes e múltiplas regiões geográficas. É **crítico** porque é o ambiente onde todo o código vai rodar em produção. Sem isso pronto, nenhuma squad pode fazer deploy. Tomou mais do que o planejado (+14%) pela complexidade de configurar isolamento de rede entre regiões para atender às exigências de soberania de dados do GDPR.

---

**Tópico 3 — Baseline de Segurança**

Com a infra pronta, o time de Segurança entrou para garantir que a fundação fosse construída com segurança desde o início — não remendada depois.

> **Criptografia e tokenização** *(72h / 84h)*
> Dados financeiros são um alvo premium de hackers. Antes de qualquer integração bancária, o CISO estabeleceu os padrões de criptografia em repouso e em trânsito, e o modelo de tokenização de dados sensíveis (números de conta, CPF, etc. nunca ficam em texto puro). Veio antes da identidade porque a criptografia define *como* as credenciais serão armazenadas.

> **Gestão de segredos (Vault/KMS)** *(72h / 81h)*
> Em paralelo, o AppSec configurou o HashiCorp Vault para gerenciar chaves de API, senhas de banco e certificados. Sem isso, segredos acabam em variáveis de ambiente ou, pior, no código — o maior vetor de vazamento em sistemas modernos.

> **Modelo de identidade / OAuth2** *(96h / 109h)* · **Caminho crítico**
> A última tarefa da fundação define *como* usuários e serviços se autenticam no sistema. A escolha pelo OAuth2/OIDC centralizado foi estratégica: um único ponto de autenticação para todos os países, com suporte a MFA obrigatório. É **crítica** porque o F1 inteiro começa daqui — sem identidade, não há onboarding, e sem onboarding, não há produto.

---

### F1 — MVP Brasil
**Período:** 16/Set/2024 → 11/Jun/2025 · **Status:** Concluído

#### A história desta fase

Com a fundação pronta, o time virou sua atenção para o primeiro mercado: o Brasil. A escolha do Brasil como piloto não foi por acaso — é o mercado mais familiar para o time, tem o Open Finance mais maduro do mundo (o BACEN é referência global), e o LGPD, embora rigoroso, é mais simples de implementar do que o GDPR europeu. O Brasil seria o laboratório onde aprenderíamos a operar antes de entrar em terrenos regulatórios ainda mais complexos.

A fase durou 9 meses e foi a mais longa — e mais difícil — do projeto.

---

**Tópico 1 — Identidade & Onboarding**

Não existe app financeiro sem saber quem é o usuário. Esta foi a primeira entrega do produto real.

> **Gestão de consentimento** *(72h / 88h)*
> O primeiro passo foi construir o mecanismo de consentimento — a tela onde o usuário autoriza o app a acessar seus dados bancários. Isso veio antes do KYC e da autenticação porque define o *framework legal* de como os dados serão coletados. A LGPD exige que o consentimento seja granular, revogável e auditável. Construir isso errado significaria invalidar todos os dados coletados depois.

> **Fluxo KYC/AML** *(120h / 138h)*
> KYC (Know Your Customer) é a verificação de identidade exigida por reguladores financeiros. Nenhum banco ou regulador permite que um app financeiro opere sem saber quem são seus usuários. A integração foi feita com Onfido/Jumio para validar documentos e fazer prova de vida por biometria. Tomou mais do que o planejado (+15%) porque a API do parceiro mudou durante a integração, exigindo retrabalho.

> **Autenticação + MFA** *(120h / 117h)* · **Caminho crítico**
> Com a identidade verificada, o time construiu o sistema de login com autenticação multifator obrigatória. É **crítica** porque é o portão de entrada do produto — tudo que vem depois pressupõe que o usuário está autenticado. Foi a única tarefa desta fase que terminou *abaixo* do planejado, aproveitando o modelo de identidade construído no F0.

> **Estratégia de marca e posicionamento Brasil** *(96h / 108h)* · concomitante · prioridade média
> Em paralelo ao desenvolvimento do onboarding técnico, o squad de Marketing definiu a identidade visual, tom de voz, canais de aquisição e o plano de go-to-market para o lançamento no Brasil. A estratégia considerou o perfil do usuário brasileiro de fintech — jovem, bancarizado parcialmente, familiarizado com apps como Nubank — e posicionou o Guru Cash como uma camada de inteligência financeira sobre os dados já existentes nas contas do usuário.

---

**Tópico 2 — Integração Open Finance (BACEN)**

Esta foi a alma do Guru Cash e também onde o projeto enfrentou seus maiores desafios.

> **Agregação e normalização de transações** *(120h / 111h)*
> Antes de conectar ao BACEN, o time construiu o motor que recebe dados brutos de diferentes bancos e os transforma em um formato único. Cada banco envia os dados num formato diferente — o Itaú chama de "valor_lancamento", o Bradesco chama de "amount". Este normalizador é o tradutor universal. Veio primeiro porque os conectores bancários precisam de um destino padronizado para enviar os dados.

> **Conector Belvo/BACEN** *(168h / 210h)* · **Caminho crítico** ⚠️ +25% de estouro
> O maior estouro do projeto inteiro. A integração com o Belvo (que faz a ponte com o BACEN/Open Finance) revelou que o ecossistema brasileiro de Open Finance ainda estava em maturação — alguns bancos retornavam erros inconsistentes, outros demoravam até 40 segundos para responder. O time precisou implementar circuit breakers, filas de retry e mecanismos de fallback não previstos. É **crítica** porque sem dados bancários o produto não existe. O atraso aqui travou o início da fase de câmbio.

> **Motor de sincronização de contas** *(144h / 174h)* · **Caminho crítico** +20%
> Com o conector pronto, o time construiu o job que mantém os dados atualizados em tempo real. A complexidade estava na idempotência — garantir que a mesma transação não seja contabilizada duas vezes mesmo se o sistema cair e reiniciar. Também é **crítica** porque os módulos de categorização e saldos dependem de dados sempre frescos.

---

**Tópico 3 — Motor de Câmbio & Tributação**

O diferencial do Guru Cash para concorrentes como o Guiabolso era o suporte multi-moeda. Esta fase construiu esse motor.

> **Regras tributárias BR** *(96h / 114h)*
> O Analista Fiscal mapeou todas as regras tributárias brasileiras que impactam transações financeiras — IOF sobre câmbio, tributação de rendimentos, etc. Veio antes do motor de câmbio porque as regras de negócio precisam estar definidas antes de implementar o código.

> **Serviço de cotações FX (tempo real)** *(120h / 108h)* · **Caminho crítico**
> O time construiu o serviço que puxa cotações de câmbio em tempo real de provedores como Wise e Open Exchange Rates. A decisão de ter múltiplas fontes e fazer média ponderada foi crucial para evitar que uma falha de um provedor derrubasse o app. É **crítica** porque sem cotação não há conversão, e sem conversão o app é só mais um extrato bancário.

> **Conversão multi-moeda idempotente** *(120h / 133h)* · **Caminho crítico**
> A conversão precisava ser *idempotente* — a mesma operação executada duas vezes deve produzir o mesmo resultado. Em finanças, isso é inegociável: imagine o app cobrar IOF duas vezes porque o servidor caiu no meio de uma conversão. Também é **crítica** porque é o coração do produto.

---

**Tópico 4 — Núcleo Financeiro & App**

Com os dados bancários sincronizados e o motor de câmbio pronto, o time finalmente construiu o que o usuário vê.

> **Categorização de despesas (ML)** *(96h / 99h)*
> O time de Dados & Insights treinou um modelo de machine learning para categorizar automaticamente as transações ("supermercado", "transporte", "lazer"). A categorização automática foi uma das features mais pedidas em pesquisas com usuários. Veio antes do dashboard porque o dashboard exibe as categorias.

> **Orçamento e metas** *(96h / 101h)*
> Em paralelo, o time construiu o módulo onde o usuário define limites de gasto por categoria. Veio junto com a categorização pois são features complementares.

> **Consolidação de saldos** *(96h / 88h)*
> Com múltiplas contas em múltiplos bancos (e possivelmente em múltiplas moedas), o sistema precisa calcular o patrimônio líquido total do usuário. Esta tarefa implementou essa lógica de consolidação, convertendo tudo para a moeda base do usuário.

> **Dashboard mobile/web** *(168h / 164h)* · **Caminho crítico**
> A tela principal do produto — onde o usuário vê saldos, transações categorizadas, gráficos de gasto e metas. É **crítica** porque é o entregável visível do MVP. Sem dashboard, não há produto para testar no UAT.

---

**Tópico 5 — Qualidade**

> **Testes automatizados E2E** *(96h / 107h)*
> O time de QA escreveu testes que simulam o comportamento real de um usuário — desde o cadastro até visualizar o saldo depois de sincronizar com o banco. Esses testes rodam automaticamente a cada deploy, garantindo que nenhuma mudança quebre o fluxo principal.

> **UAT MVP Brasil** *(72h / 62h)* · **Caminho crítico**
> O teste de aceitação com usuários reais — a validação final antes do lançamento. É **crítica** porque nenhum lançamento acontece sem aprovação do PMO e do Product Owner. Foi a única tarefa do F1 que terminou abaixo do planejado, graças à qualidade dos testes automatizados que anteciparam a maioria dos bugs.

> **Estruturação do canal de suporte ao cliente** *(64h / 72h)* · concomitante · prioridade baixa
> Enquanto o UAT rodava, o squad de Suporte estruturou os canais de atendimento que estariam ativos no dia do lançamento: chat in-app, e-mail de suporte, árvore de categorização de tickets e base de conhecimento inicial. A definição dos SLAs (tempo de primeira resposta ≤ 2h, resolução ≤ 24h) foi alinhada com o PMO. Atividade concomitante; não bloqueia o UAT, mas precisa estar pronta antes do go-live.

---

### F2 — Hardening & Certificações
**Período:** 11/Jun/2025 → 29/Ago/2025 · **Status:** Concluído

#### A história desta fase

O MVP Brasil funcionava. Mas funcionando não é suficiente para entrar no mercado americano ou europeu. Reguladores internacionais não aceitam "nosso app é seguro porque achamos que é" — eles exigem *prova documental e auditada* de maturidade em segurança. Por isso, antes de qualquer expansão, o Guru Cash pausou o desenvolvimento de novas features e investiu três meses inteiros em segurança e certificações.

Esta foi uma decisão estratégica e controversa internamente — havia pressão para ir logo para o EUA. O CISO e o Gerente de Projeto argumentaram que entrar sem as certificações seria mais arriscado do que o atraso: uma negativa de licença regulatória poderia matar o produto antes de lançar.

---

**Tópico 1 — Segurança & Auditoria**

> **DPIA / conformidade LGPD** *(96h / 98h)*
> O DPO conduziu a Data Protection Impact Assessment — um mapeamento completo de todos os dados pessoais que o sistema coleta, processa e armazena, com a avaliação de riscos de cada fluxo. Exigência obrigatória da LGPD para sistemas de alto risco. Veio primeiro porque seus achados alimentaram o escopo do pentest.

> **Preparação SOC 2 / ISO 27001** *(144h / 166h)* +15%
> Em paralelo, o time de Segurança preparou toda a documentação, políticas e controles exigidos pelas certificações SOC 2 (padrão americano de segurança) e ISO 27001 (padrão internacional). Tomou mais do que o planejado porque o volume de evidências exigido pelos auditores foi subestimado — cada controle precisa de logs, screenshots e aprovações formais.

> **Pentest e correções** *(120h / 128h)* · **Caminho crítico**
> Uma empresa externa simulou ataques reais ao sistema. Encontraram 3 vulnerabilidades críticas e 11 médias — todas corrigidas durante esta sprint. É **crítica** porque os auditores externos do SOC 2 exigem o relatório de pentest como evidência. Sem isso, não há certificação; sem certificação, não há expansão.

---

**Tópico 2 — Confiabilidade**

> **Disaster Recovery / multi-AZ** *(96h / 86h)*
> O time configurou a replicação do sistema em múltiplas zonas de disponibilidade na AWS. Se um datacenter cair, outro assume em segundos. Reguladores financeiros exigem SLA de 99,9% de disponibilidade — impossível com um único servidor.

> **Monitoramento e alertas** *(72h / 87h)*
> Expansão de observabilidade com alertas automáticos para anomalias — pico de erros, latência alta, uso incomum de CPU. Com 10 países futuros, não dá para monitorar manualmente.

> **Testes de carga e tuning** *(96h / 110h)* · **Caminho crítico**
> O time simulou 50.000 usuários simultâneos. O sistema quebrou na primeira rodada — gargalo no banco de dados. Após otimizações (índices, caching, connection pooling), passou. É **crítica** porque o relatório de load test é exigido pelos reguladores americanos como prova de capacidade do sistema.

> **Treinamento e playbooks de suporte** *(80h / 88h)* · concomitante · prioridade baixa
> Enquanto o time técnico fazia hardening, o squad de Suporte usou o período para preparar a equipe de atendimento para o mercado internacional: playbooks de atendimento para os cenários mais comuns de produto financeiro (falha de sincronização bancária, erro de conversão, bloqueio de conta), FAQs em português e inglês, e protocolos de escalonamento para incidentes críticos. Uma preparação silenciosa que pagaria dividendos no F5.

---

### F3 — Expansão EUA
**Período:** 29/Ago/2025 → 26/Nov/2025 · **Status:** Concluído

#### A história desta fase

Com as certificações no bolso, o time olhou para o segundo mercado: os Estados Unidos. A escolha do EUA antes da Europa foi estratégica — o mercado americano de Open Banking ainda estava em amadurecimento (sem um equivalente ao PSD2 obrigatório), o que paradoxalmente tornava a integração mais simples. Além disso, o inglês americano é comum à equipe, reduzindo o custo de localização.

---

**Tópico 1 — Integração EUA**

> **Regras fiscais/tributárias US** *(120h / 110h)*
> O Analista Fiscal mapeou as regras americanas: retenção de imposto (withholding tax), FATCA para cidadãos americanos no exterior, e as diferenças de tributação estado-a-estado. Veio antes do conector porque as regras ditam como as transações devem ser classificadas e reportadas.

> **Conector Plaid** *(144h / 150h)* · **Caminho crítico**
> O Plaid é o agregador dominante no mercado americano — conecta com mais de 12.000 instituições financeiras nos EUA. A integração foi mais tranquila do que o Belvo (+4% apenas), porque a API do Plaid é mais madura. É **crítica** porque sem dados bancários americanos, não há produto nos EUA.

---

**Tópico 2 — Localização & Compliance EUA**

> **i18n en-US (data/moeda)** *(72h / 86h)*
> Localização vai além de traduzir textos. Datas no Brasil são DD/MM/AAAA; nos EUA são MM/DD/AAAA. Moedas têm símbolos diferentes. O ponto e a vírgula se invertem nos números. O time fez a localização completa da interface para o inglês americano. Tomou mais do que o planejado (+19%) pois vários componentes de UI tinham datas e valores hardcoded.

> **Compliance US (CFPB/FinCEN)** *(96h / 89h)* · **Caminho crítico**
> O time de Compliance adaptou o sistema para atender ao CFPB (Consumer Financial Protection Bureau) e ao FinCEN (Financial Crimes Enforcement Network). Isso incluiu relatórios de transações suspeitas (SAR), limites de movimentação e políticas de AML americanas. É **crítica** porque sem compliance aprovado, o lançamento é proibido.

> **UAT EUA** *(72h / 71h)* · **Caminho crítico**
> Teste de aceitação com usuários americanos reais — beta fechado com 200 usuários. O feedback principal foi sobre o fluxo de conexão de contas, que foi simplificado antes do go-live.

> **Campanha de aquisição — mercado americano** *(120h / 134h)* · concomitante · prioridade média
> Em paralelo ao UAT, o squad de Marketing executou as campanhas de pré-lançamento nos EUA: anúncios pagos no Google e Meta segmentados para o público fintech americano, parcerias com influenciadores do nicho personal finance (YouTube, TikTok), e estratégia de ASO (App Store Optimization) para garantir presença orgânica nas lojas. O estouro de +12% veio do volume de variações de criativos testados para calibrar o CAC antes do go-live.

---

### F4 — Expansão Europa
**Período:** 26/Nov/2025 → 16/Mar/2026 · **Status:** Concluído

#### A história desta fase

A Europa foi reservada para terceiro lugar por uma razão clara: é o ambiente regulatório mais complexo do mundo para fintechs. O GDPR tem multas de até 4% do faturamento global. O PSD2 obriga bancos a abrirem suas APIs, mas cada país da UE implementou de forma ligeiramente diferente. E o time precisaria atender não a um país, mas a vários simultaneamente — Alemanha, França, Reino Unido, Espanha, Portugal, entre outros.

---

**Tópico 1 — Integração Europa**

> **Regras fiscais multi-país EU** *(144h / 139h)*
> O Analista Fiscal mapeou as particularidades tributárias de cada país europeu-alvo — IVA variável por país, tributação de investimentos, regras de retenção na fonte. Uma tarefa que exigiu consultoria fiscal local em cada jurisdição. Veio antes do conector para garantir que os dados capturados já chegassem classificados corretamente.

> **Conector TrueLayer/Tink (PSD2)** *(168h / 194h)* · **Caminho crítico** +15%
> O PSD2 obriga bancos europeus a exporem APIs de Open Banking, mas cada país implementou o padrão de forma ligeiramente diferente. O TrueLayer (UK, Irlanda) e o Tink (continente europeu) cobrem esse mosaico. O estouro de +15% veio das variações entre os bancos — o Deutsche Bank retorna dados num formato, o BNP Paribas em outro. É **crítica** porque é a espinha dorsal do produto europeu.

---

**Tópico 2 — Localização & GDPR**

> **i18n múltiplos idiomas EU** *(120h / 103h)*
> O time localizou o app para português (PT), inglês (UK), alemão, francês e espanhol. Diferente do EUA, aqui terminaram abaixo do planejado porque o sistema de i18n construído no F3 era mais flexível do que o esperado.

> **Conformidade GDPR + DPAs** *(120h / 149h)* · **Caminho crítico** ⚠️ +24% de estouro
> O segundo maior estouro do projeto. O GDPR exige que dados de cidadãos europeus sejam armazenados em servidores dentro da UE — o time precisou criar uma infraestrutura separada na Europa. Além disso, cada país tem sua própria DPA (Data Protection Authority) com requisitos adicionais. É **crítica** porque operar sem conformidade GDPR é ilegal e pode resultar em multas milionárias.

> **UAT Europa** *(72h / 67h)* · **Caminho crítico**
> Beta fechado com usuários em 5 países europeus. O principal aprendizado: usuários alemães e franceses esperavam mais transparência sobre onde seus dados ficam armazenados — um banner informativo foi adicionado ao onboarding.

> **Campanha de aquisição — mercado europeu** *(120h / 118h)* · concomitante · prioridade média
> Paralelamente ao UAT europeu, o squad de Marketing adaptou as campanhas para o mosaico cultural europeu: versões de conteúdo em português (PT), inglês (UK), alemão, francês e espanhol; SEO localizado por país; e estratégia de performance marketing respeitando as restrições de cookies do GDPR (sem third-party tracking, foco em first-party data e campanhas contextuais). Foi a única atividade de marketing que terminou levemente abaixo do planejado — o sistema de i18n construído no F3 acelerou a produção de criativos localizados.

---

### F5 — Lançamento Global
**Período:** 16/Mar/2026 → 22/Jun/2026 · **Status:** Em andamento (98%)

#### A história desta fase

Com Brasil, EUA e Europa operando, chegou a hora do grande lançamento. Os outros 7 países do roadmap (Canadá, México, Argentina, Austrália, Japão, Cingapura e Emirados Árabes) entrariam numa única ondada — aproveitando toda a infraestrutura já construída.

---

**Tópico 1 — Escala & Operação**

> **Suporte 24/7 e runbooks** *(72h / 88h)*
> Antes de abrir o produto para o mundo, o time de operações documentou todos os procedimentos de resposta a incidentes — o que fazer se o banco X cair, se houver pico de tráfego, se uma integração retornar erro. Com times em fusos horários diferentes, runbooks claros são a diferença entre um incidente resolvido em 5 minutos e uma crise que dura horas.

> **Otimização de performance multi-região** *(120h / 134h)* · **Caminho crítico**
> Com usuários em múltiplos continentes, a latência virou problema. O time configurou CDN global, caching regionalizado e replicação de banco de dados para garantir que um usuário japonês tenha a mesma experiência que um brasileiro. É **crítica** porque um app lento em mercados como Japão e Cingapura simplesmente não é adotado.

> **Go-live global / rollout 10 países** *(140h / 136h)* · **Caminho crítico**
> O lançamento foi feito em ondas ao longo de uma semana — primeiro os países com menor risco regulatório, depois os mais complexos. O time de operações monitorou dashboards em tempo real durante todo o processo. É **crítica** porque é o entregável final — o momento em que o produto chega às mãos dos usuários nos 10 países.

> **Operação de CS no go-live global** *(120h / 128h)* · concomitante · prioridade média
> Durante todo o período de rollout, o squad de Suporte operou em regime 24/7 — coberta com um Head de Suporte e um Customer Success Lead em turnos intercalados com o suporte terceirizado contratado para os idiomas locais. Cada onda de lançamento gerava um pico previsível de tickets (falhas de conexão bancária, dúvidas de KYC, problemas de câmbio). Os playbooks construídos no F2 provaram seu valor: o tempo médio de resolução ficou 40% abaixo da meta, e nenhum incidente crítico passou das 2h sem resolução.

---

**Tópico 2 — Pós-lançamento**

> **Retrospectiva e lições aprendidas** *(78h / 87h)*
> O time se reuniu para documentar tudo que deu certo, tudo que deu errado e tudo que aprendeu. Os dois maiores aprendizados: (1) subestimar a complexidade de integrações Open Finance é perigoso — sempre adicionar buffer de 30%; (2) iniciar compliance de forma paralela ao desenvolvimento, não depois.

> **Monitoramento de adoção e insights** *(140h / 0h)* · **EM ABERTO**
> A única tarefa ainda em andamento — o time de Dados & Insights está construindo os dashboards de métricas de produto (DAU, MAU, taxa de conversão freemium→premium, NPS por país). Isso alimentará as decisões do próximo roadmap.

> **Monitoramento de métricas de aquisição global** *(80h / 60h — 75%)* · concomitante · prioridade média · **EM ANDAMENTO**
> Em paralelo, o squad de Marketing acompanha as métricas de topo de funil nos 10 países: CAC por canal e região, DAU/MAU dos primeiros 30 dias, taxa de ativação (usuário que conecta pelo menos uma conta bancária), e ROI das campanhas. Os dados preliminares estão sendo usados para realocar budget de mídia dos países com CAC mais alto para os de melhor performance.

> **Análise de NPS e feedback pós-lançamento** *(64h / 40h — 60%)* · concomitante · prioridade baixa · **EM ANDAMENTO**
> O squad de Suporte está consolidando os primeiros indicadores de satisfação: NPS por país (escala 0–10 coletada no app após 7 dias de uso), reviews nas lojas (App Store e Google Play) e uma rodada de entrevistas qualitativas com early adopters selecionados. Os principais temas emergentes — velocidade de sincronização bancária e clareza das categorias automáticas — já estão sendo encaminhados para o backlog de produto.

---

## 5. Marcos (13 · todos atingidos)

| Marco | Data | Etapa |
|---|---|---|
| ✅ Kick-off do Projeto | 22/Abr/2024 | F0 — Discovery & Fundação |
| ✅ Arquitetura e Tech Stack Aprovados | 06/Jun/2024 | F0 — Discovery & Fundação |
| ✅ M1 — Fundação concluída | 18/Mar/2025 | F0 — Discovery & Fundação |
| ✅ MVP Brasil — Aprovado em UAT | 11/Jun/2025 | F1 — MVP Brasil |
| ✅ M2 — MVP Brasil (GA Brasil) | 26/Set/2025 | F1 — MVP Brasil |
| ✅ Certificações SOC 2 e ISO 27001 Obtidas | 31/Ago/2025 | F2 — Hardening & Certificações |
| ✅ M3 — Certificações (SOC 2 / ISO 27001) | 22/Nov/2025 | F2 — Hardening & Certificações |
| ✅ Lançamento nos EUA — Go-Live | 26/Nov/2025 | F3 — Expansão EUA |
| ✅ M4 — Beta EUA | 24/Jan/2026 | F3 — Expansão EUA |
| ✅ Lançamento na Europa — Go-Live | 16/Mar/2026 | F4 — Expansão Europa |
| ✅ M5 — Beta Europa | 12/Abr/2026 | F4 — Expansão Europa |
| ✅ Go-Live Global — 10 países simultâneos | 13/Mai/2026 | F5 — Lançamento Global |
| ✅ M6 — GA Global (10 países) | 05/Jun/2026 | F5 — Lançamento Global |

---

## 6. Decisões Formais (6)

### D1 — Adoção de arquitetura event-driven com Kafka
**Responsável:** Tech Lead / Arquiteto · **Status:** Decidida

Após comparar arquitetura monolítica vs. microsserviços síncronos, optou-se por event-driven com Kafka para suportar alta concorrência e integrações assíncronas com múltiplos bancos em 10 países sem acoplamento direto entre serviços. Garante resiliência a falhas parciais e escalabilidade independente por domínio.

---

### D2 — Uso de agregadores Open Finance (Belvo/Plaid/TrueLayer) em vez de integrações bancárias diretas
**Responsável:** Tech Lead / Arquiteto · **Status:** Decidida

Integrações diretas com cada banco demandariam 18+ meses adicionais de desenvolvimento. Agregadores reduzem drasticamente o time-to-market, centralizam o tratamento de erros e isolam o produto de mudanças de contrato. Custo incremental de R$36.000 em taxas de uso aprovado pelo Sponsor/CFO.

---

### D3 — Estratégia de expansão geográfica sequencial: BR → EUA → EU → Global
**Responsável:** Gerente de Projeto · **Status:** Decidida

Avaliadas estratégias de lançamento simultâneo em todos os países vs. expansão faseada. Optou-se pela sequência para validar compliance por jurisdição antes de avançar, absorver lições aprendidas e reduzir o risco de penalidades regulatórias. O mercado brasileiro funciona como piloto de escala.

---

### D4 — Certificações SOC 2 e ISO 27001 como pré-requisito para expansão internacional
**Responsável:** CISO · **Status:** Decidida

Reguladores americanos e europeus exigem comprovação formal de maturidade em segurança para licenciamento. Inserida fase dedicada de Hardening (F2) antes de qualquer expansão, tornando SOC 2 e ISO 27001 gates obrigatórios de avanço entre F2→F3 e F2→F4.

---

### D5 — Modelo de monetização freemium com premium tier diferenciado por país
**Responsável:** Product Owner · **Status:** Decidida

Análise de mercado e benchmarking com Revolut, Wise e Nubank indicou que precificação flat global não se adapta a poderes aquisitivos distintos. O modelo freemium permite adoção massiva inicial; a conversão para premium monetiza funcionalidades avançadas (FX em tempo real, insights ML, relatórios fiscais) com pricing localizado.

---

### D6 — Corte de custos: cancelamento das missões técnicas internacionais
**Responsável:** Gerente de Projeto · **Status:** Decidida

Após revisão orçamentária pelo Sponsor/CFO no Q2/2025, identificou-se pressão de caixa decorrente de estouros nas integrações Open Finance e conformidade regulatória. Canceladas as missões presenciais para EUA (R$70.000), Europa (R$85.000) e lançamento global (R$120.000), substituídas por onboarding remoto e parceiros jurídicos locais já contratados. **Economia: R$275.000 (19,5% do orçamento não-pessoal).** A missão ao Brasil (R$25.000) foi mantida por ser essencial para homologação presencial junto ao BACEN.

---

## 7. Riscos (7 ativos)

| Risco | Probabilidade | Impacto | Plano de resposta |
|---|---|---|---|
| Não conformidade LGPD/GDPR/PSD2 | Média | Alto | DPO dedicado, privacy by design, DPIA por jurisdição |
| Instabilidade de APIs bancárias | **Alta** | Alto | Agregadores, retries, circuit breaker, fallback |
| Regras fiscais variadas por país | **Alta** | Alto | Motor de regras configurável, consultoria fiscal local |
| Inconsistência na conversão de moeda | Média | Alto | Fonte FX confiável, idempotência, reconciliação contínua |
| Escalabilidade / alta concorrência | Média | Alto | Arquitetura event-driven, load testing, auto-scaling |
| Fraude / AML | Média | Alto | KYC robusto, monitoramento transacional, scoring de risco |
| Vazamento de dados financeiros | Baixa | Alto | Criptografia, tokenização, pentest, bug bounty, SOC 2 |

---

## 8. Custos

### 8.1 Visão geral

| Origem | Valor |
|---|---|
| Custo de pessoal planejado (horas × custo/h nas tarefas) | R$ 1.408.320 |
| Custo de pessoal realizado | R$ 1.370.520 |
| Lançamentos manuais (infra, ferramentas, consultoria, etc.) | R$ 1.091.500 |
| **Custo total do projeto** | **R$ 2.461.820** |

### 8.2 Lançamentos manuais por etapa

#### F0 — Discovery & Fundação · R$ 190.000
| Item | Categoria | Valor |
|---|---|---|
| Reserva de contingência (~10% do orçamento) | Ferramentas | R$ 140.000 |
| Banco de dados (setup inicial e licenças) | Infraestrutura | R$ 30.000 |
| Treinamentos (onboarding técnico e metodológico) | Pessoal | R$ 20.000 |

#### F1 — MVP Brasil · R$ 338.000
| Item | Categoria | Valor |
|---|---|---|
| Nuvem (servidores, containers, balanceadores) | Infraestrutura | R$ 115.000 |
| Integração Open Finance (Belvo — setup e licenciamento) | Ferramentas | R$ 60.000 |
| APIs de IA (categorização de despesas e insights ML) | Ferramentas | R$ 50.000 |
| Taxas de uso dos agregadores Open Finance | Ferramentas | R$ 36.000 |
| Consultoria Open Finance Brasil (homologação BACEN) | Freelancers | R$ 28.000 |
| Viagens — parceiros bancários Brasil (SP/BSB) | Ferramentas | R$ 25.000 |
| Monitoramento e logs (observabilidade) | Infraestrutura | R$ 14.000 |
| Taxas de lojas (Apple/Google), domínios e SSL | Ferramentas | R$ 8.000 |
| Armazenamento e backups | Infraestrutura | R$ 2.000 |

#### F2 — Hardening & Certificações · R$ 114.500
| Item | Categoria | Valor |
|---|---|---|
| Auditoria externa SOC 2 / ISO 27001 / PCI-DSS | Freelancers | R$ 45.000 |
| Seguros corporativos (cyber insurance e E&O) | Ferramentas | R$ 25.000 |
| Serviços de segurança (pentest, bug bounty, AppSec) | Ferramentas | R$ 22.500 |
| Consultoria LGPD/conformidade (DPO externo + DPIA) | Freelancers | R$ 22.000 |

#### F3 — Expansão EUA · R$ 95.000
| Item | Categoria | Valor |
|---|---|---|
| Assessoria regulatória FinTech EUA (CFPB/FinCEN) | Freelancers | R$ 35.000 |
| Licenciamento regulatório EUA (CFPB, FinCEN, SEC) | Ferramentas | R$ 30.000 |
| Assessoria jurídica local nos EUA | Freelancers | R$ 30.000 |
| ~~Viagens EUA (NY/DC)~~ | ~~Ferramentas~~ | ~~R$ 70.000~~ ❌ cortado |

#### F4 — Expansão Europa · R$ 135.000
| Item | Categoria | Valor |
|---|---|---|
| Licenciamento regulatório Europa (FCA, BaFin, DPAs) | Ferramentas | R$ 50.000 |
| Assessoria jurídica local na Europa (GDPR, PSD2) | Freelancers | R$ 45.000 |
| Consultoria conformidade PSD2/EBA | Freelancers | R$ 40.000 |
| ~~Viagens Europa (Londres/Frankfurt/Amsterdã)~~ | ~~Ferramentas~~ | ~~R$ 85.000~~ ❌ cortado |

#### F5 — Lançamento Global · R$ 219.000
| Item | Categoria | Valor |
|---|---|---|
| Marketing e go-to-market (10 países — campanhas, ASO) | Freelancers | R$ 120.000 |
| Suporte ao cliente multilíngue 24/7 (terceirizado) | Freelancers | R$ 84.000 |
| Assessoria jurídica local (demais países) | Freelancers | R$ 15.000 |
| ~~Viagens implantação global (10 países)~~ | ~~Ferramentas~~ | ~~R$ 120.000~~ ❌ cortado |

### 8.3 Corte de custos — viagens canceladas

| Missão | Valor cortado |
|---|---|
| Missão técnica EUA (Nova York / Washington DC) | R$ 70.000 |
| Missão técnica Europa (Londres / Frankfurt / Amsterdã) | R$ 85.000 |
| Visitas de implantação global (10 países) | R$ 120.000 |
| **Total economizado** | **R$ 275.000** |

Substituídas por onboarding remoto estruturado com parceiros jurídicos e técnicos locais já contratados. Decisão formal registrada pelo Gerente de Projeto (D6).

### 8.4 Lançamentos manuais por categoria

| Categoria | Valor |
|---|---|
| Freelancers (consultorias, jurídico, suporte, auditoria, marketing) | R$ 454.000 |
| Ferramentas (Open Finance, IA, licenças, taxas, seguros, contingência) | R$ 421.500 |
| Infraestrutura (nuvem, BD, armazenamento, monitoramento) | R$ 196.000 |
| Pessoal (treinamentos) | R$ 20.000 |
| **Total** | **R$ 1.091.500** |

---

## 9. Destaques do Caminho Crítico

28 tarefas no caminho crítico distribuídas nas 6 fases. Os maiores estouros ocorreram em:

| Tarefa | Planejado | Realizado | Estouro | Por que aconteceu |
|---|---|---|---|---|
| Conector Belvo/BACEN | 168h | 210h | +25% | Ecossistema Open Finance BR ainda em maturação; bancos retornavam erros inconsistentes |
| Conformidade GDPR + DPAs | 120h | 149h | +24% | Cada país da UE tem requisitos adicionais além do GDPR base |
| Fluxo KYC/AML | 120h | 138h | +15% | API do parceiro Onfido mudou durante a integração |
| Conector TrueLayer/PSD2 | 168h | 194h | +15% | Variações de implementação do PSD2 por banco europeu |
| Preparação SOC 2 / ISO 27001 | 144h | 166h | +15% | Volume de evidências exigido pelos auditores subestimado |

---

## 10. Roadmap Resumido

```
Abr/2024   Set/2024   Jun/2025   Ago/2025   Nov/2025   Mar/2026   Jun/2026
    |          |          |          |          |          |          |
   [F0 — Discovery & Fundação——]
              [F1 ————————— MVP Brasil ——————————]
                                   [F2 Hard.]
                                              [F3 EUA—]
                                                        [F4 EU——]
                                                                  [F5 Global]
    ✅         ✅         ✅         ✅         ✅         ✅         ✅
  Kick-off  Arq.     MVP BR    SOC2/    EUA    Europa  Go-Live
           Aprovada  UAT OK   ISO27001 Go-Live Go-Live  Global
```
