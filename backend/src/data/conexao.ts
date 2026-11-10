/* Arthur Lopes Santos Silva - Conexao da API com o banco Oracle */



/* Os dados de acesso ficam no arquivo .env, que nao vai para o GitHub.
   Copie o .env.example para .env e preencha com a sua senha. */

import oracledb from "oracledb";

/* Faz o Oracle devolver cada linha como objeto ({ ID: 1, NOME: "..." })
   em vez de array ([1, "..."]). Fica muito mais facil de ler no codigo. */
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

/* Faz textos longos (CLOB) virem como string pronta, e nao como stream */
oracledb.fetchAsString = [oracledb.CLOB];


/* ===== DADOS DE ACESSO =====
   Vem do arquivo .env. Os valores depois do || sao usados
   quando a variavel nao existir, para o projeto rodar sem configuracao. */
const USUARIO = process.env.DB_USUARIO || "fluxo";
const SENHA = process.env.DB_SENHA || "";
const CONEXAO = process.env.DB_CONEXAO || "localhost:1521/orclpdb";


/* ===== ABRIR A CONEXAO =====
   Chamada uma unica vez, quando o servidor liga.

   Um "pool" e um conjunto de conexoes que fica aberto e vai sendo
   reaproveitado. Abrir uma conexao nova a cada requisicao seria lento. */
export async function iniciarBanco(): Promise<void> {
    await oracledb.createPool({
        user: USUARIO,
        password: SENHA,
        connectString: CONEXAO,
        poolMin: 1,
        poolMax: 5
    });

    console.log("Conectado ao banco Oracle em " + CONEXAO);
}

/* Fecha o pool quando o servidor e encerrado */
export async function fecharBanco(): Promise<void> {
    await oracledb.getPool().close(5);
}


/* ===== CONSULTAR (SELECT) =====
   Devolve a lista de linhas encontradas.

   O segundo parametro sao os valores que entram na consulta.
   Sempre use essa forma, nunca junte texto com +, porque juntar
   texto abre brecha para SQL Injection:

   OK:    consultar("SELECT * FROM demandas WHERE id = :id", { id: 5 })
   NAO:   consultar("SELECT * FROM demandas WHERE id = " + id)              */
export async function consultar(sql: string, parametros: any = {}): Promise<any[]> {
    const conexao = await oracledb.getConnection();

    try {
        const resultado = await conexao.execute(sql, parametros);
        return resultado.rows || [];

    } finally {
        /* O finally roda mesmo se a consulta der erro.
           Sem isso, a conexao nao volta para o pool e o sistema trava. */
        await conexao.close();
    }
}


/* ===== EXECUTAR (INSERT, UPDATE, DELETE) =====
   Devolve o resultado da operacao.

   O autoCommit grava de verdade no banco. Sem ele, a alteracao
   some quando a conexao fecha. */
export async function executar(sql: string, parametros: any = {}): Promise<any> {
    const conexao = await oracledb.getConnection();

    try {
        return await conexao.execute(sql, parametros, { autoCommit: true });

    } finally {
        await conexao.close();
    }
}


/* ===== BUSCAR UMA LINHA SO =====
   Atalho para quando a consulta devolve no maximo um registro.
   Devolve a linha ou null. */
export async function consultarUm(sql: string, parametros: any = {}): Promise<any | null> {
    const linhas = await consultar(sql, parametros);

    if (linhas.length === 0) {
        return null;
    }

    return linhas[0];
}