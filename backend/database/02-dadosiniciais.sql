-- Arthur Lopes Santos Silva - Dados iniciais de teste

-- ============================================================
-- PROJETOS
-- ============================================================
INSERT INTO projetos (id, nome) VALUES (1, 'Portal do Aluno');
INSERT INTO projetos (id, nome) VALUES (2, 'App de Entregas');
INSERT INTO projetos (id, nome) VALUES (3, 'Sistema Financeiro');


-- ============================================================
-- USUARIOS
-- Os cinco integrantes, cobrindo os tres perfis do escopo.
-- A senha de todos e Senha@1234, guardada como hash bcrypt.
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(1, 'Arthur Lopes', 'arthur_lopes@fluxo.com',
 '$2b$10$jLvyy7XkXWcIvWS2R1OqwelQMNItSqatElQ2IW2rKG5srPV.4DpKO', 'Membro da Equipe');

INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(2, 'Gabriel Augusto', 'gabriel_augusto@fluxo.com',
 '$2b$10$jLvyy7XkXWcIvWS2R1OqwelQMNItSqatElQ2IW2rKG5srPV.4DpKO', 'Administrador');

INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(3, 'Leonardo Souza', 'leonardo_souza@fluxo.com',
 '$2b$10$jLvyy7XkXWcIvWS2R1OqwelQMNItSqatElQ2IW2rKG5srPV.4DpKO', 'Líder de Projeto');

INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(4, 'Pedro Businari', 'pedro_businari@fluxo.com',
 '$2b$10$jLvyy7XkXWcIvWS2R1OqwelQMNItSqatElQ2IW2rKG5srPV.4DpKO', 'Administrador');

INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(5, 'Pedro Osti', 'pedro_osti@fluxo.com',
 '$2b$10$jLvyy7XkXWcIvWS2R1OqwelQMNItSqatElQ2IW2rKG5srPV.4DpKO', 'Membro da Equipe');


-- ============================================================
-- DEMANDAS
-- Tipos, prioridades, status e prazos variados de proposito,
-- para os filtros e o dashboard terem o que mostrar.
--
-- TO_DATE converte o texto em data. O formato 'YYYY-MM-DD' evita
-- depender da configuracao de idioma do banco.
-- ============================================================
INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(1, 'Corrigir cálculo do frete para pedidos acima de R$ 200',
 'O frete continua sendo cobrado mesmo com a regra de frete grátis ativa.',
 'Defeito', 'Alta', 'Em andamento', 2, 3,
 TO_TIMESTAMP('2026-09-18 09:12', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-09-24 15:40', 'YYYY-MM-DD HH24:MI'),
 TO_DATE('2026-12-20', 'YYYY-MM-DD'));

INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(2, 'Tela de login aceita senha em branco',
 'É possível entrar no sistema sem digitar a senha.',
 'Defeito', 'Crítica', 'Aberta', 1, NULL,
 TO_TIMESTAMP('2026-10-01 10:00', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-10-01 10:00', 'YYYY-MM-DD HH24:MI'),
 TO_DATE('2026-11-28', 'YYYY-MM-DD'));

INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(3, 'Criar relatório mensal de vendas',
 'Relatório com o total vendido por mês e por vendedor.',
 'Tarefa', 'Média', 'Em revisão', 3, 2,
 TO_TIMESTAMP('2026-09-05 08:30', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-10-08 11:20', 'YYYY-MM-DD HH24:MI'),
 TO_DATE('2026-12-10', 'YYYY-MM-DD'));

INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(4, 'Melhorar tempo de carregamento da listagem',
 'A listagem demora mais de 5 segundos com muitos registros.',
 'Melhoria', 'Média', 'Aberta', 2, 4,
 TO_TIMESTAMP('2026-10-03 14:00', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-10-03 14:00', 'YYYY-MM-DD HH24:MI'),
 TO_DATE('2027-01-15', 'YYYY-MM-DD'));

INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(5, 'Escrever manual de instalação do sistema',
 'Documentar os passos para instalar o sistema em um servidor novo.',
 'Documentação', 'Baixa', 'Concluída', 1, 5,
 TO_TIMESTAMP('2026-08-20 09:00', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-09-15 17:00', 'YYYY-MM-DD HH24:MI'),
 TO_DATE('2026-09-15', 'YYYY-MM-DD'));

INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(6, 'Servidor fica fora do ar ao gerar nota fiscal',
 'Ao gerar a nota, a aplicação para de responder e precisa ser reiniciada.',
 'Defeito', 'Crítica', 'Aberta', 3, 2,
 TO_TIMESTAMP('2026-10-09 16:45', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-10-09 16:45', 'YYYY-MM-DD HH24:MI'),
 TO_DATE('2026-11-10', 'YYYY-MM-DD'));

INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(7, 'Padronizar as cores dos botões do sistema',
 'Alguns botões usam azul claro e outros azul escuro.',
 'Melhoria', 'Baixa', 'Cancelada', 1, NULL,
 TO_TIMESTAMP('2026-09-10 13:00', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-09-28 10:00', 'YYYY-MM-DD HH24:MI'),
 NULL);

INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, data_atualizacao, prazo) VALUES
(8, 'Permitir exportar a listagem de demandas em PDF',
 'O usuário precisa baixar a listagem filtrada em PDF.',
 'Tarefa', 'Alta', 'Em andamento', 2, 3,
 TO_TIMESTAMP('2026-09-28 11:30', 'YYYY-MM-DD HH24:MI'),
 TO_TIMESTAMP('2026-10-07 09:15', 'YYYY-MM-DD HH24:MI'),
 TO_DATE('2026-11-08', 'YYYY-MM-DD'));


-- ============================================================
-- COMENTARIOS
-- ============================================================
INSERT INTO comentarios (demanda_id, usuario_id, texto, data_hora) VALUES
(1, 3, 'Consegui reproduzir. O problema está na função que soma o total.',
 TO_TIMESTAMP('2026-09-19 10:05', 'YYYY-MM-DD HH24:MI'));

INSERT INTO comentarios (demanda_id, usuario_id, texto, data_hora) VALUES
(1, 2, 'Boa. Prioriza isso antes da entrega de sexta.',
 TO_TIMESTAMP('2026-09-19 14:30', 'YYYY-MM-DD HH24:MI'));

INSERT INTO comentarios (demanda_id, usuario_id, texto, data_hora) VALUES
(1, 3, 'Correção feita, falta testar com três itens no carrinho.',
 TO_TIMESTAMP('2026-09-24 15:38', 'YYYY-MM-DD HH24:MI'));

INSERT INTO comentarios (demanda_id, usuario_id, texto, data_hora) VALUES
(6, 2, 'Aconteceu de novo hoje de manhã, com dois usuários diferentes.',
 TO_TIMESTAMP('2026-10-10 08:20', 'YYYY-MM-DD HH24:MI'));

INSERT INTO comentarios (demanda_id, usuario_id, texto, data_hora) VALUES
(3, 2, 'Relatório pronto, aguardando revisão do Líder de Projeto.',
 TO_TIMESTAMP('2026-10-08 11:18', 'YYYY-MM-DD HH24:MI'));


-- ============================================================
-- HISTORICO
-- Mostra como as alteracoes ficam registradas (item 2.2.7).
-- ============================================================
INSERT INTO historico (demanda_id, usuario_id, campo, valor_anterior, valor_novo, data_hora) VALUES
(1, 2, 'responsavel', NULL, 'Leonardo Souza',
 TO_TIMESTAMP('2026-09-19 09:00', 'YYYY-MM-DD HH24:MI'));

INSERT INTO historico (demanda_id, usuario_id, campo, valor_anterior, valor_novo, data_hora) VALUES
(1, 3, 'status', 'Aberta', 'Em andamento',
 TO_TIMESTAMP('2026-09-24 15:40', 'YYYY-MM-DD HH24:MI'));

INSERT INTO historico (demanda_id, usuario_id, campo, valor_anterior, valor_novo, data_hora) VALUES
(3, 2, 'status', 'Em andamento', 'Em revisão',
 TO_TIMESTAMP('2026-10-08 11:20', 'YYYY-MM-DD HH24:MI'));

INSERT INTO historico (demanda_id, usuario_id, campo, valor_anterior, valor_novo, data_hora) VALUES
(5, 5, 'status', 'Em revisão', 'Concluída',
 TO_TIMESTAMP('2026-09-15 17:00', 'YYYY-MM-DD HH24:MI'));

INSERT INTO historico (demanda_id, usuario_id, campo, valor_anterior, valor_novo, data_hora) VALUES
(7, 2, 'status', 'Aberta', 'Cancelada',
 TO_TIMESTAMP('2026-09-28 10:00', 'YYYY-MM-DD HH24:MI'));


-- ============================================================
-- AJUSTE DOS CONTADORES DE ID
-- Como os ids acima foram informados na mao, o contador automatico
-- das tabelas continua em 1 e daria erro de chave duplicada no
-- primeiro cadastro feito pela API. Estas linhas acertam isso.
-- ============================================================
ALTER TABLE projetos MODIFY (id GENERATED BY DEFAULT AS IDENTITY (START WITH 4));
ALTER TABLE usuarios MODIFY (id GENERATED BY DEFAULT AS IDENTITY (START WITH 6));
ALTER TABLE demandas MODIFY (id GENERATED BY DEFAULT AS IDENTITY (START WITH 9));

COMMIT;


-- ============================================================
-- CONFERENCIA
-- Rode estas consultas depois para ver se carregou certo.
-- ============================================================
-- SELECT COUNT(*) AS projetos    FROM projetos;     -- esperado: 3
-- SELECT COUNT(*) AS usuarios    FROM usuarios;     -- esperado: 5
-- SELECT COUNT(*) AS demandas    FROM demandas;     -- esperado: 8
-- SELECT COUNT(*) AS comentarios FROM comentarios;  -- esperado: 5
-- SELECT COUNT(*) AS historico   FROM historico;    -- esperado: 5
-- SELECT status, COUNT(*) FROM demandas GROUP BY status;