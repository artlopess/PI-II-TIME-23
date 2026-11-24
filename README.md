#  PI - II - TIME 23
## Sistema de Acompanhamento de Demandas de Desenvolvimento

---

##  Informações do Projeto

| Campo | Informação |
|-------|-----------|
|  **Projeto** | Sistema de Acompanhamento de Demandas de Desenvolvimento |
|  **Componente Curricular** | Projeto Integrador II |
|  **Curso** | Engenharia de Software |
|  **Semestre/Ano** | 2º Semestre de 2026 |
|  **Professora Orientadora** | Profa. Dra. Renata Arantes |

---

##  Integrantes

| Nome | RA |
|------|----|
| Arthur Lopes Santos Silva | 26010221 |
| Gabriel Augusto Jorge | 26010868 |
| Leonardo Antunes de Souza | 26004615 |
| Pedro Osti Cruz | 26011726 |
| Pedro Businari Kawamoto | 26007360 |

---

## 📋 Sobre o projeto

O sistema tem como objetivo simular uma ferramenta de gestão utilizada por equipes de tecnologia para organizar e acompanhar **demandas de desenvolvimento** — como tarefas, defeitos (bugs), melhorias e atividades de documentação — ao longo de um ou mais projetos de software.
 
Cada demanda cadastrada no sistema possui informações como título, descrição, tipo, prioridade, status, projeto associado, responsável, datas de criação e atualização, além de um prazo de finalização. As demandas podem ser criadas, visualizadas, filtradas, atualizadas e canceladas, seguindo um fluxo de trabalho (workflow) que vai desde a abertura até a conclusão ou cancelamento.

---

## ⚙️ Como executar

Pré-requisitos: **Node.js LTS** e um **Oracle** acessível (o driver `oracledb` usa modo *thin*, sem precisar de Instant Client).

1. Instale as dependências do backend:

   ```bash
   cd backend
   npm install
   ```

2. Copie o modelo de variáveis de ambiente e preencha com os dados do seu Oracle:

   ```bash
   copy .env.example .env        # Windows
   # cp .env.example .env        # Linux/Mac
   ```

   | Variável | Descrição |
   |----------|-----------|
   | `DB_USUARIO` | Usuário Oracle dono das tabelas (precisa ter `CREATE TABLE` para o seed) |
   | `DB_SENHA` | Senha desse usuário |
   | `DB_CONEXAO` | `host:porta/nome_do_serviço`, ex.: `localhost:1521/orclpdb` |
   | `JWT_SEGREDO` | **Obrigatório**: segredo usado para assinar os tokens JWT (sem ele a API não inicia; não há valor padrão) |
   | `CORS_ORIGENS` | Origens do frontend autorizadas a chamar a API, separadas por vírgulas. Opcional; o padrão cobre `localhost`/`127.0.0.1` nas portas 3001 e 5500 |

3. Crie as tabelas e carregue os dados iniciais:

   ```bash
   npm run seed
   ```

   O seed é **destrutivo**: ele apaga e recria `projetos`, `usuarios`, `usuario_projetos`, `demandas`, `comentarios` e `historico` usando os scripts em `backend/database/`. Ao final, mostra a quantidade de registros de cada tabela.

4. Inicie a API (ela só abre a porta 3000 após conectar ao Oracle):

   ```bash
   npm run dev
   ```

5. Abra as telas em `frontend/pages/` com um servidor estático. No VS Code, use o botão **Go Live** e copie a URL que ele abrir (a porta aparece na barra de status, por exemplo `5500` ou `3001`). Exemplos, conforme a raiz configurada do Live Server:
   - `http://127.0.0.1:3001/frontend/pages/login.html`
   - `http://127.0.0.1:3001/pages/login.html`

   Depois do login, troque `login.html` por `detalhes.html?id=3` nessa mesma URL. **Não** digite `http://frontend/...`: `frontend` é uma pasta, não um endereço de servidor — use sempre `localhost` ou `127.0.0.1`.

### Segurança da API

- `JWT_SEGREDO` deve ser definido no `.env`: a API falha na subida se ele estiver vazio (não há segredo fixo no código).
- O CORS só responde às origens listadas em `CORS_ORIGENS` (padrão: `localhost`/`127.0.0.1` nas portas 3001 e 5500). Outras origens recebem `403`.
- `POST /login` aceita no máximo **5 tentativas por IP a cada 15 minutos**; depois disso responde `429` com `Retry-After`. Um login correto zera o contador.
- Comentários têm no máximo **500 caracteres** (validado pela API e pelo formulário).

Usuários de teste (senha `Senha@1234` para todos): `arthur_lopes@fluxo.com` (Membro), `gabriel_augusto@fluxo.com` (Admin), `leonardo_souza@fluxo.com` (Líder), `pedro_businari@fluxo.com` (Admin) e `pedro_osti@fluxo.com` (Membro).
