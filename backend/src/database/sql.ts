/* Time PI-II-TIME-23 - Utilitário para dividir scripts SQL em comandos executáveis */

/**
 * Remove linhas de comentário (-- ...) e separa o script por ponto e vírgula.
 * O ponto e vírgula dentro de textos entre aspas é ignorado, para não quebrar
 * frases como "R$ 200; ...".
 */
export function separarComandos(sql: string): string[] {
    const semComentarios = sql
        .split(/\r?\n/)
        .filter(linha => !linha.trimStart().startsWith('--'))
        .join('\n');

    const comandos: string[] = [];
    let comandoAtual = '';
    let dentroDeTexto = false;

    for (const caractere of semComentarios) {
        // Duas aspas seguidas ('') representam uma aspa dentro do texto;
        // alternar duas vezes deixa o estado final inalterado.
        if (caractere === "'") {
            dentroDeTexto = !dentroDeTexto;
            comandoAtual += caractere;
        } else if (caractere === ';' && dentroDeTexto === false) {
            if (comandoAtual.trim() !== '') {
                comandos.push(comandoAtual.trim());
            }
            comandoAtual = '';
        } else {
            comandoAtual += caractere;
        }
    }

    if (comandoAtual.trim() !== '') {
        comandos.push(comandoAtual.trim());
    }

    return comandos;
}
