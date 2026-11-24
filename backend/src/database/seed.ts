/* Time PI-II-TIME-23 - Rotina de seed do Oracle: recria tabelas e carrega os dados iniciais
 *
 * Uso: npm run seed (dentro da pasta backend, com o .env preenchido).
 * ATENÇÃO: este comando é destrutivo — ele apaga e recria as tabelas do sistema.
 */

import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import oracledb from "oracledb";
import type { Connection } from "oracledb";

import { iniciarBanco, fecharBanco } from "../data/conexao";
import { separarComandos } from "./sql";

// Ordem das chaves estrangeiras: quem referencia é apagado primeiro.
const TABELAS = ["historico", "comentarios", "demandas", "usuario_projetos", "usuarios", "projetos"];

// Os arquivos já existentes em backend/database/ são a fonte única dos dados.
const SCRIPTS = ["01-estrutura.sql", "02-dadosiniciais.sql"];
const DIRETORIO_SCRIPTS = path.resolve(__dirname, "..", "..", "database");

function mensagemDoErro(erro: unknown): string {
    return erro instanceof Error ? erro.message : String(erro);
}

async function descartarTabelas(conexao: Connection): Promise<void> {
    for (const tabela of TABELAS) {
        try {
            await conexao.execute(`DROP TABLE ${tabela} PURGE`);
            console.log(`Tabela ${tabela} removida.`);
        } catch (erro) {
            // ORA-00942: a tabela ainda não existe — não é um problema.
            if ((erro as { errorNum?: number })?.errorNum !== 942) {
                throw erro;
            }
            console.log(`Tabela ${tabela} ainda não existia.`);
        }
    }
}

async function executarScript(conexao: Connection, arquivo: string): Promise<void> {
    const caminho = path.join(DIRETORIO_SCRIPTS, arquivo);
    const conteudo = fs.readFileSync(caminho, "utf8");
    const comandos = separarComandos(conteudo);

    console.log(`${arquivo}: ${comandos.length} comando(s).`);

    for (const comando of comandos) {
        try {
            await conexao.execute(comando);
        } catch (erro) {
            throw new Error(
                `Falha em ${arquivo} no comando:\n${comando}\n\n${mensagemDoErro(erro)}`
            );
        }
    }
}

async function conferirCarga(conexao: Connection): Promise<void> {
    // Ordem invertida: projetos, usuários, demandas, comentários e histórico.
    for (const tabela of [...TABELAS].reverse()) {
        const resultado = await conexao.execute(`SELECT COUNT(*) AS TOTAL FROM ${tabela}`);
        const linhas = resultado.rows as Array<{ TOTAL: number | bigint }>;
        console.log(`${tabela}: ${linhas[0]?.TOTAL ?? 0} registro(s).`);
    }
}

async function executarSeed(): Promise<void> {
    console.log("ATENÇÃO: o seed apaga e recria as tabelas projetos, usuarios, usuario_projetos, demandas, comentarios e historico.");

    await iniciarBanco();

    let conexao: Connection | null = null;

    try {
        conexao = await oracledb.getConnection();

        await descartarTabelas(conexao);
        for (const arquivo of SCRIPTS) {
            await executarScript(conexao, arquivo);
        }

        await conexao.commit();
        await conferirCarga(conexao);

        console.log("Seed concluído com sucesso. Agora é possível iniciar a API com npm run dev.");
    } catch (erro) {
        if (conexao !== null) {
            await conexao.rollback();
        }
        throw erro;
    } finally {
        if (conexao !== null) {
            await conexao.close();
        }
        await fecharBanco();
    }
}

executarSeed().catch(erro => {
    console.error("Falha no seed:", mensagemDoErro(erro));
    process.exit(1);
});
