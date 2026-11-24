# Análise de conformidade e plano de correção — PI-II-TIME-23

Documento gerado em 24/11/2026 a partir da comparação entre o código do repositório e o `Documento Escopo_PI_II.PDF` (14 páginas, extraído localmente para leitura). **Nenhum código foi alterado** para a elaboração deste documento.

Legenda: ✅ implementado · ⚠️ parcial · ❌ faltando

---

## 1. Arquitetura atual

- **Backend** (`backend/src/`): API Express + TypeScript. `server.ts` registra 5 roteadores: `rotas/autenticacao.ts`, `rotas/demandas.ts`, `rotas/projetos.ts`, `rotas/detalhes.ts`, `rotas/dashboard.ts`.
- **Dados em runtime**: `backend/src/data/dados.ts` (arrays em memória para usuários, projetos, demandas e comentários).
- **Persistência disponível, mas não utilizada**: scripts `backend/database/01-estrutura.sql` e `02-dadosiniciais.sql` (Oracle: `projetos`, `usuarios`, `demandas`, `comentarios`, `historico`) e `backend/src/data/conexao.ts` (pool `oracledb`, helpers `consultar`/`executar` com binds). `iniciarBanco()` nunca é chamado em `server.ts`.
- **Frontend** (`frontend/`): HTML/CSS/JS puro, sem build; páginas em `pages/`, lógica em `scripts/`, estilos em `styles/`; chamadas `fetch` diretas à API em `http://localhost:3000`. Cadastro, edição, login e dashboard integrados; listagem estática.
- **Arquivos órfãos/conflitantes**:
  - `demandas.routes.ts` (raiz): rota de listagem duplicada, não registrada, com import quebrado (`../data/dados`).
  - `backend/src/listagem.ts`: segundo servidor Express com dados falsos, não registrado; se executado, disputaria a porta 3000.
  - `frontend/scripts/prioridade.js`, `status.js`, `tipo-demanda.js`, `finalizaçao.js`: não referenciados por nenhum HTML.
  - `docs/`: apenas uma cópia do PDF de escopo.

---

## 2. Requisitos funcionais (escopo §2)

| Req. | Status | Evidência / arquivos |
|---|---|---|
| Projetos pré-configurados, cada demanda vinculada a um projeto | ⚠️ | `backend/database/02-dadosiniciais.sql:6-8`, `backend/src/data/dados.ts:18-22`, `backend/src/rotas/projetos.ts:15-22`; somente consulta e em memória |
| 4 tipos (Tarefa, Defeito, Melhoria, Documentação) | ✅ | CHECK em `01-estrutura.sql:67-69`, validação em `backend/src/rotas/demandas.ts:19`, selects em `cadastro-demanda.html:49-55` / `editar-demanda.html:46-52` |
| 4 prioridades (Crítica, Alta, Média, Baixa) | ✅ | `01-estrutura.sql:70-72`, `backend/src/rotas/demandas.ts:20`, formulários |
| 5 status (Aberta, Em andamento, Em revisão, Concluída, Cancelada) | ✅ | `01-estrutura.sql:73-75`, `backend/src/rotas/dashboard.ts:34-40`, `editar-demanda.html:104-113` |
| Toda demanda nasce como **Aberta** | ✅ | `backend/src/rotas/demandas.ts:219`; campo desabilitado em `cadastro-demanda.html:108-112` |
| Ciclo de vida (Aberta→Em andamento→Em revisão→Concluída; revisão→andamento; qualquer status→Cancelada se não concluída) | ⚠️ | Tabela `TRANSICOES_PERMITIDAS` em `backend/src/rotas/demandas.ts:25-31`, aplicada no PUT (`:269-287`). Falta registro no histórico e restrição por perfil |
| Não permitir Em andamento→Concluída nem Em andamento→Aberta | ✅ | Mesma tabela (`demandas.ts:26-27`) |
| Campos mínimos (título, descrição, tipo, prioridade, status, projeto, responsável, criação, atualização, prazo) | ✅ | Interface em `backend/src/data/dados.ts:25-37`, tabela em `01-estrutura.sql:48-82`, formulários; responsável opcional |
| Datas de criação/atualização automáticas | ⚠️ | Servidor define em `demandas.ts:210,224-225,309`; apenas em memória, sem trigger/default de atualização no banco |
| API externa obrigatória para feriado no prazo | ⚠️ | `nomeDoFeriado()` em `backend/src/rotas/demandas.ts:71-102` (BrasilAPI), usada no POST e PUT (`:173-186`). Desvio: quando a API falha, a validação é ignorada (`fail-open`, `:97-101`), contrariando "impedir o cadastro" |
| Comentários vinculados a demanda e usuário, com data/hora | ⚠️ | Tabela em `01-estrutura.sql:89-102`; `GET/POST /demandas/:id/comentarios` em `backend/src/rotas/detalhes.ts:34-88`; UI em `detalhes.html:50-57` + `detalhes.js:66-105`. Sem persistência; `usuarioId` vem do corpo da requisição (`:59,97`), não do token; fallback para id 1 em `detalhes.js:109-112` |
| Histórico automático de alterações relevantes; não apagado | ⚠️ | Apenas esquema (`01-estrutura.sql:110-126`) e dados de exemplo (`02-dadosiniciais.sql:138-156`). Não há gravação no PUT, nem rota `GET .../historico`; a tela exibe "Histórico ainda não disponível." (`detalhes.html:42-44`) |
| Cadastrar demanda | ✅ | `POST /demandas` em `backend/src/rotas/demandas.ts:194-237`; `cadastro-demanda.html`; `frontend/scripts/demanda.js:337-388` |
| **Listar demandas** | ❌ | **Não existe `GET /demandas` registrado no servidor.** Só em código morto: `backend/src/listagem.ts:34-92` (dados falsos) e `demandas.routes.ts:11-120` (raiz, não importado). `frontend/pages/listagem.html` é tabela fixa |
| Visualizar detalhes de uma demanda | ✅ | `GET /demandas/:id` em `backend/src/rotas/detalhes.ts:12-29`; `detalhes.html`; `detalhes.js:43-62` |
| Editar demanda | ⚠️ | `PUT /demandas/:id` em `backend/src/rotas/demandas.ts:242-316`; bloqueia Concluída, mas não Cancelada; exige corpo completo. `demanda.js:154-181` espera `{ demanda: ... }`, mas a API devolve o objeto direto → edição não pré-preenche |
| Atualizar status | ⚠️ | Embutido no PUT genérico (`demandas.ts:269-287`); sem endpoint dedicado e sem checagem de perfil |
| Cancelar demanda | ⚠️ | Via `PUT` com `status: "Cancelada"`; sem ação funcional na UI (`botao-cancelar` em `cadastro-demanda.html:125` e `editar-demanda.html:141` são `<div>` sem handler) e sem histórico |
| Sem exclusão física de registros | ✅ | Nenhuma rota `DELETE` no repositório |
| Listagem com título, tipo, prioridade, status, projeto, responsável, criação e prazo | ❌ | `frontend/pages/listagem.html:36-83`: estática, sem projeto, sem data de criação, sem JS e sem link no menu (`dashboard.html:22` usa `href="#"`) |
| Filtros por no mínimo 2 critérios (status, prioridade, tipo, responsável, projeto) | ⚠️ | Só em código não registrado: `backend/src/listagem.ts:63-71` e `demandas.routes.ts:38-66`; os selects do HTML não têm lógica |
| Busca textual por título/descrição | ⚠️ | `backend/src/listagem.ts:69-70` e `demandas.routes.ts:68-73` (normalização de acentos), ambos órfãos |
| Ordenação por prioridade, criação, prazo ou status | ⚠️ | `backend/src/listagem.ts:73-89` e `demandas.routes.ts:75-108`; um usa parâmetro `ordenar`, o outro `ordenarPor` (inconsistência) |
| Dashboard: total, por status, por prioridade, por tipo, críticas em aberto, próximas do prazo | ✅ | Rota `backend/src/rotas/dashboard.ts:9-98`, tela `frontend/pages/dashboard.html`, integração `frontend/scripts/dashboard.js:52-96` |
| Dashboard: **quantidade** de demandas próximas do prazo | ❌ | API devolve a lista `proximasDoPrazo` (`dashboard.ts:77-86,96`), sem contagem; UI apenas lista (`dashboard.js:89`) |
| Autenticação por login | ✅ | `POST /login` em `backend/src/rotas/autenticacao.ts:13-36` (bcrypt + JWT 2h), `login.html`, `login.js:131-164`, helper `frontend/scripts/autenticacao.js` |
| Três perfis (Administrador, Líder de Projeto, Membro da Equipe) | ⚠️ | Perfis em `backend/src/data/dados.ts:9-15`, `02-dadosiniciais.sql:16-34`, CHECK em `01-estrutura.sql:38-40`, presentes no JWT (`autenticacao.ts:30`). `exigirPerfil()` existe em `backend/src/middleware/autenticacao.ts:28-36`, mas **nunca é usado**; só `GET /usuarios` exige token (`:39`). Qualquer usuário pode criar/editar/comentar; não há escopo por projeto nem restrição de transições por perfil; a UI não esconde ações |
| Visualização de usuários e projetos | ⚠️ | `GET /usuarios` (`autenticacao.ts:39-41`) exige token; `GET /projetos` (`projetos.ts:15-22`). Em `demanda.js:123-148`, `carregarResponsaveis()` lê `dados.usuarios`, mas a API devolve array e o `fetch` não envia `Authorization` → select fica vazio |

---

## 3. Requisitos de ambiente e regras gerais (escopo §3 e §4)

| Req. | Status | Evidência / arquivos |
|---|---|---|
| Backend Node.js LTS + TypeScript | ✅ | `backend/package.json:5-29` (scripts `tsx`, `typescript`, Express 5) |
| Frontend HTML5/CSS3/JS, Bootstrap opcional | ✅ | `frontend/pages/`, `frontend/styles/`, `frontend/scripts/`; Bootstrap não usado (opcional) |
| Interface responsiva | ⚠️ | Somente `frontend/styles/demanda.css:220` possui `@media`; demais telas usam larguras fixas |
| Banco relacional MySQL ou Oracle | ⚠️ | Oracle escolhido: `oracledb` em `backend/package.json:20`, `conexao.ts`, scripts SQL. Não integrado em runtime: sem chamada a `iniciarBanco()`, sem `dotenv` e sem `.env.example` real (mencionado em `conexao.ts:6`), dados em memória |
| Git, GitHub e branches de desenvolvimento | ✅ | Remote `origin/artlopess/PI-II-TIME-23.git`, `main` e branches remotas `Leonardo`, `arthur`, `gabrieljorge`, `pedrom-cruz`, `Pedro-Businari`; merges via PR no histórico |
| GitHub Projects e apontamento de horas | ❌ | Nada no repositório permite verificar; nenhuma referência no `README.md` |
| Nome do repositório `PI-II-TIME 23` | ✅ | Pasta local e remote `PI-II-TIME-23` |
| Tag de release `1.0.0-final` | ❌ | `git tag` vazio |
| README na raiz com descrição, equipe e instruções de execução/implantação | ⚠️ | `README.md` (34 linhas) descreve projeto e integrantes; falta como instalar, executar backend/frontend, configurar Oracle, variáveis de ambiente e testes |
| Comentários explicativos e autor no topo de cada arquivo | ⚠️ | Maioria possui cabeçalho. Sem identificação: `backend/src/listagem.ts`, `demandas.routes.ts` (raiz), `frontend/scripts/prioridade.js`, `frontend/scripts/tipo-demanda.js`, `frontend/scripts/finalizaçao.js`, `frontend/styles/listagem.css`; `listagem.html` só tem `<!--Pedro Osti-->`. `listagem.html:88` termina com `` ``` `` solto |
| Segurança (relevante mesmo fora do escopo explícito) | ⚠️ | bcrypt/JWT ok; segredo fixo em `backend/src/config.ts:4`, `Access-Control-Allow-Origin: *` em `server.ts:27`, token em `localStorage`, rotas de demanda/comentários/dashboard sem autenticação |
| Testes automatizados | ❌ | `backend/package.json:7` contém script de teste placeholder que sempre falha; nenhum teste no repositório |
| Aplicação funcionando de ponta a ponta para a banca | ❌ | Listagem sem rota, responsáveis sem carregar, edição sem preencher, histórico inexistente e banco desconectado |

---

## 4. Problemas críticos de integração

1. **Rota de listagem inexistente**: `server.ts:46-51` não registra `GET /demandas`; `backend/src/listagem.ts` e `demandas.routes.ts` são duplicatas mortas e conflitantes.
2. **Contratos frontend/backend divergentes**: `demanda.js:137` lê `dados.usuarios` (API devolve array); `demanda.js:165` lê `dados.demanda` (API devolve objeto direto); ambos os `fetch` omitem `Authorization`.
3. **Perfis apenas decorativos**: `exigirPerfil()` implementado, mas nunca aplicado; regras de Membro/Líder do escopo descumpridas.
4. **Scripts órfãos e incompatíveis**: `prioridade.js`, `status.js`, `tipo-demanda.js`, `finalizaçao.js` não são carregados; `status.js:3` usa `em_andamento`/`concluida` em vez dos valores do escopo; `status.js:48-61` exige título com 10 caracteres e projeto como texto de 10 caracteres, conflitando com `demanda.js`.
5. **Finalização simulada**: `frontend/scripts/finalizaçao.js:92` apenas exibe mensagem de sucesso, sem chamar a API, e não está referenciado em nenhuma página.
6. **Banco desconectado**: esquema correto e completo, mas nenhuma rota o utiliza; sem `.env.example`, sem `iniciarBanco()`, sem seed automatizado.

---

## 5. Plano de ação ordenado por prioridade

### P0 — Desbloquear os fluxos básicos (fazer primeiro)

1. **Unificar a listagem de demandas**
   - Remover/fundir `backend/src/listagem.ts` e `demandas.routes.ts` em uma única rota em `backend/src/rotas/demandas.ts` (ou novo `listagem.ts` dentro de `backend/src/rotas/`), registrada em `backend/src/server.ts`.
   - Implementar `GET /demandas` com filtros (status, prioridade, tipo, responsável, projeto), busca textual normalizada e ordenação (prioridade, data de criação, prazo, status), reaproveitando a lógica existente e padronizando o parâmetro (`ordenarPor`).
   - **Critério de aceite**: `GET /demandas?status=Aberta&prioridade=Crítica&ordenarPor=prioridade&direcao=asc` responde JSON com `total` e `demandas`.
2. **Corrigir contratos do cadastro/edição**
   - Em `frontend/scripts/demanda.js`: usar `chamarApi()` (que envia token) para `/usuarios` e `/demandas/:id`; aceitar a resposta em array de `/usuarios` e o objeto direto de `/demandas/:id`.
   - **Critério de aceite**: abrir `editar-demanda.html?id=1` com todos os campos preenchidos; select de responsável com os 5 usuários.
3. **Conectar a tela de listagem**
   - Substituir a tabela fixa em `frontend/pages/listagem.html` por renderização via `GET /demandas`, com colunas obrigatórias (título, tipo, prioridade, status, projeto, responsável, criação, prazo), filtros, busca, ordenação e link para `detalhes.html?id=...`; corrigir menu em `dashboard.html:22-24` e remover o `` ``` `` solto.
   - **Critério de aceite**: navegar do dashboard até a listagem e filtrar sem recarregar a página.

### P1 — Cumprir as regras de negócio centrais

4. **Aplicar perfis de acesso de verdade**
   - Usar `verificarToken` + `exigirPerfil(...)` em todas as rotas sensíveis (`POST/PUT /demandas`, `GET/POST comentários`, `GET /usuarios`, `GET /dashboard`).
   - Restringir transições por perfil: Membro apenas Aberta→Em andamento e Em andamento→Em revisão nas demandas a ele atribuídas; Líder apenas nos projetos vinculados; Administrador sem restrição.
   - Implementar vínculo usuário↔projeto (nova tabela `usuario_projetos` + seed) para suportar "projetos aos quais está vinculado".
   - Ajustar UI para esconder/desabilitar ações não permitidas (`obterUsuario().perfil` em `frontend/scripts/autenticacao.js`).
   - **Critério de aceite**: token de Membro recebe 403 ao tentar Concluir/Cancelar ou editar demanda de outro projeto.
5. **Histórico de alterações completo**
   - Criar `backend/src/rotas/historico.ts` com `GET /demandas/:id/historico`; gravar automaticamente no `PUT /demandas/:id` sempre que status, responsável, prioridade ou prazo mudarem (e no cancelamento), com `usuario_id` do token e `valor_anterior`/`valor_novo`.
   - Renderizar em `frontend/pages/detalhes.html:40-44` via `frontend/scripts/detalhes.js`.
   - **Critério de aceite**: cada alteração relevante gera uma linha legível no histórico, inclusive após cancelamento, e nada é apagado.
6. **Comentários com autor autenticado**
   - Em `backend/src/rotas/detalhes.ts:57-88`, trocar `usuarioId` do corpo por `res.locals.usuario.id` (middleware `verificarToken`) e exigir token no `frontend/scripts/detalhes.js`.
   - **Critério de aceite**: comentário gravado com o usuário logado; req sem token retorna 401.
7. **Revisar validação de prazo/feriado**
   - Manter BrasilAPI, mas falhar fechado quando a consulta não puder ser feita (erro 503 com mensagem clara) ou, no mínimo, sinalizar na resposta que a verificação não ocorreu; alinhar `frontend/scripts/finalizaçao.js` (ou removê-lo) ao fluxo real de conclusão via API.
   - **Critério de aceite**: prazo em feriado nacional é recusado no POST e no PUT, inclusive com falha de rede.

### P2 — Persistência real no Oracle

8. **Ativar o banco no backend**
   - Adicionar `dotenv`, criar `.env.example` (sem segredos) com `DB_USUARIO`, `DB_SENHA`, `DB_CONEXAO`, `JWT_SEGREDO`; documentar no README.
   - Chamar `iniciarBanco()`/`fecharBanco()` em `server.ts` e tratar falha de conexão na subida.
   - **Critério de aceite**: API inicia conectada ao pool Oracle; sem `.env`, falha com mensagem explícita.
9. **Migrar rotas de `dados.ts` para SQL**
   - Substituir arrays por consultas via `consultar()`/`executar()` em `autenticacao.ts`, `demandas.ts`, `detalhes.ts`, `projetos.ts`, `dashboard.ts` e novo `historico.ts`; usar transações para alterações atômicas (demanda + histórico).
   - Criar script de seed idempotente (reutilizar `02-dadosiniciais.sql`) e, se necessário, trigger/GBQ para `data_atualizacao`.
   - **Critério de aceite**: reiniciar o servidor sem perder cadastros, comentários e histórico; nenhuma rota usa arrays em memória.
10. **Revisar esquema para o vínculo de projeto e índices**
    - Adicionar tabela de associação usuário-projeto e respectivos índices/FKs em `01-estrutura.sql`; ajustar seeds.

### P3 — Qualidade, segurança e entrega

11. **Limpar arquivos mortos e duplicados**
    - Remover `demandas.routes.ts` (raiz), `backend/src/listagem.ts` (servidor duplicado) e os validadores órfãos `frontend/scripts/prioridade.js`, `status.js`, `tipo-demanda.js`, `finalizaçao.js` — ou integrá-los, se ainda forem úteis, eliminando regras divergentes (valores snake_case e comprimentos diferentes).
    - Garantir cabeçalho com autor + comentários explicativos em **todos** os arquivos (escopo §4.5), inclusive CSS e HTML.
12. **Segurança básica**
    - Segredo JWT exclusivamente via `.env` (sem fallback fixo), CORS restrito às origens do frontend, `httpOnly` ou pelo menos evitar `localStorage` para token quando possível, validação de entrada centralizada.
13. **README completo**
    - Incluir pré-requisitos (Node LTS, Oracle), passo a passo de instalação, criação do `.env`, execução dos scripts SQL, comando do backend (`npm install && npm run dev` em `backend/`), como abrir o frontend, credenciais de teste (`Senha@1234`) e instruções para banca.
14. **Testes e release**
    - Substituir o script `test` placeholder por testes das regras críticas (transições de status, perfis, feriado, histórico, filtros).
    - Criar a tag `1.0.0-final` somente após a validação de ponta a ponta (escopo §4.3).
    - Registrar tarefas e horas no GitHub Projects (escopo §4.6); convidar banca apenas quando o orientador autorizar (§4.8).

### P4 — Refinamentos (se houver tempo)

15. Responsividade das telas de login, listagem, detalhes e dashboard (`@media`), mantendo identidade visual "Fluxo".
16. Contadores explícitos de "demandas críticas em aberto" e "próximas do prazo" no payload do dashboard, além das listas.
17. Botão "Cancelar demanda" funcional com confirmação e registro no histórico (em vez do `<div>` estático).

---

## 6. Ordem sugerida de execução

`P0.1 → P0.2 → P0.3 → P1.4 → P1.5 → P1.6 → P1.7 → P2.8 → P2.9 → P2.10 → P3.11 → P3.12 → P3.13 → P3.14 → P4`

Justificativa: P0 restabelece os fluxos que hoje estão quebrados; P1 garante conformidade com as regras de negócio e permissões; P2 elimina o principal passivo técnico (dados voláteis); P3 cobre as penalidades explícitas do escopo (ausência de README, tag, autoria e Projects); P4 são melhorias de experiência.
