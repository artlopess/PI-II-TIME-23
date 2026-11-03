// Gabriel Augusto Jorge - Integração da tela de Dashboard com a API (Reunião 5)


// Endereço da API (o backend roda na porta 3000)
const API_URL = 'http://localhost:3000';

// Escreve um valor dentro do elemento que tem o id informado
function preencher(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = valor ?? 0; // se não vier valor, mostra 0
  }
}

// Mostra a mensagem de erro na caixa vermelha do topo da tela
function mostrarErro(mensagem) {
  document.getElementById('mensagem-erro').textContent = mensagem;
}

// Transforma a data da API (ex.: 2026-11-05T00:00:00Z) em 05/11/2026
function formatarData(dataISO) {
  if (!dataISO) return 'sem prazo';
  return new Date(dataISO).toLocaleDateString('pt-BR');
}

// Cria uma linha para cada demanda dentro da lista informada
function preencherLista(idLista, demandas, textoSeVazia) {
  const lista = document.getElementById(idLista);
  lista.innerHTML = ''; // apaga o "Carregando..."

  // Se a lista vier vazia, mostra um aviso no lugar
  if (!demandas || demandas.length === 0) {
    const aviso = document.createElement('div');
    aviso.className = 'values';
    aviso.textContent = textoSeVazia;
    lista.appendChild(aviso);
    return;
  }

  for (const demanda of demandas) {
    const linha = document.createElement('div');
    linha.className = 'values';
    linha.textContent =
      `#${demanda.id} - ${demanda.titulo} | ${demanda.prioridade} | ${demanda.status} | prazo: ${formatarData(demanda.prazoFinalizacao)}`;
    lista.appendChild(linha);
  }
}

// Função principal: chama a API e preenche a tela
async function carregarDashboard() {
  // Repassa o ?dias= da página para a API (ex.: dashboard.html?dias=3)
  const dias = new URLSearchParams(window.location.search).get('dias');
  const url = dias !== null ? `${API_URL}/dashboard?dias=${encodeURIComponent(dias)}` : `${API_URL}/dashboard`;

  try {
    const resposta = await fetch(url);                     // faz o GET na API
    const dados = await resposta.json().catch(() => ({})); // lê o JSON da resposta

    // Se a API respondeu com erro (400, 404, 500...), mostra a mensagem dela na tela
    if (!resposta.ok) {
      mostrarErro(`Erro ${resposta.status}: ${dados.erro || 'não foi possível carregar o dashboard.'}`);
      return;
    }

    // Indicadores por status
    preencher('kpi-total', dados.total);
    preencher('kpi-aberta', dados.porStatus['Aberta']);
    preencher('kpi-andamento', dados.porStatus['Em andamento']);
    preencher('kpi-revisao', dados.porStatus['Em revisão']);
    preencher('kpi-concluida', dados.porStatus['Concluída']);
    preencher('kpi-cancelada', dados.porStatus['Cancelada']);

    // Por prioridade
    preencher('prio-critica', dados.porPrioridade['Crítica']);
    preencher('prio-alta', dados.porPrioridade['Alta']);
    preencher('prio-media', dados.porPrioridade['Média']);
    preencher('prio-baixa', dados.porPrioridade['Baixa']);

    // Por tipo
    preencher('tipo-tarefa', dados.porTipo['Tarefa']);
    preencher('tipo-defeito', dados.porTipo['Defeito']);
    preencher('tipo-melhoria', dados.porTipo['Melhoria']);
    preencher('tipo-documentacao', dados.porTipo['Documentação']);

    // Listas de atenção
    preencherLista('lista-criticas', dados.criticasEmAberto, 'Nenhuma demanda crítica em aberto.');
    preencherLista('lista-prazo', dados.proximasDoPrazo, 'Nenhuma demanda vencendo nos próximos dias.');

  } catch (erro) {
    // Cai aqui quando nem deu para falar com a API (servidor desligado, CORS etc.)
    mostrarErro('Não foi possível conectar à API. Verifique se o servidor está rodando (npm run dev).');
    console.error(erro);
  }
}

carregarDashboard();