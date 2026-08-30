/* =========================================================================
   estado.js — Preferencias salvas e estado da sessao.
   Tudo o que o aluno ajusta fica no localStorage do proprio navegador.
   ========================================================================= */

const CHAVE = 'dcap:prefs:v1';
const CHAVE_PROGRESSO = 'dcap:progresso:v1';

export const PADROES = {
  tema: 'escuro',
  som: true,
  efeitos: true,
  pularBoot: false,
  minutos: 20,
  tempoInfinito: false,
  tamanho: 32,
  modo: 'logica-basica',
  foco: 'geral',          // geral | repeticao | condicao | procedimento
  linguagem: 'blocos',    // blocos | portugol
  divisao: 50,            // porcentagem da largura para a area de codigo
  animarDesenho: true,
};

function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return { ...padrao };
    return { ...padrao, ...JSON.parse(bruto) };
  } catch (e) {
    return { ...padrao };
  }
}

export const prefs = ler(CHAVE, PADROES);

export function salvarPrefs() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(prefs));
    return true;
  } catch (e) {
    return false;
  }
}

export function definir(chave, valor, salvar = true) {
  prefs[chave] = valor;
  if (salvar) salvarPrefs();
  aplicarTema();
}

export function limparCache() {
  try {
    localStorage.removeItem(CHAVE);
    localStorage.removeItem(CHAVE_PROGRESSO);
  } catch (e) { /* ignorado */ }
  if ('caches' in window) {
    caches.keys().then((nomes) => nomes.forEach((n) => caches.delete(n)));
  }
}

export function aplicarTema() {
  const raiz = document.documentElement;
  raiz.setAttribute('data-tema', prefs.tema);
  raiz.setAttribute('data-efeitos', prefs.efeitos ? 'on' : 'off');
}

/* ------------------------------------------------------------ progresso */

export const progresso = ler(CHAVE_PROGRESSO, {
  pontosTotais: 0,
  artesCompletas: 0,
  glifos: [],          // indices do alfabeto ja decodificados
  insignias: [],       // ids conquistados
  melhorPorNivel: {},  // { "32": 1234 }
});

export function salvarProgresso() {
  try {
    localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
  } catch (e) { /* ignorado */ }
}

/* ---------------------------------------------------- estado da sessao */

export const sessao = {
  emTreino: false,
  pausado: false,
  pontos: 0,
  artesFeitas: 0,
  artesPassadas: 0,
  erroAcumulado: 0,
  arteAtual: null,
  inicioArte: 0,
  glifosNovos: [],
  insigniasNovas: [],
  historico: [],       // { nome, percentual, pontos, segundos, blocos, par }
};

export function zerarSessao() {
  sessao.emTreino = false;
  sessao.pausado = false;
  sessao.pontos = 0;
  sessao.artesFeitas = 0;
  sessao.artesPassadas = 0;
  sessao.erroAcumulado = 0;
  sessao.arteAtual = null;
  sessao.inicioArte = 0;
  sessao.glifosNovos = [];
  sessao.insigniasNovas = [];
  sessao.historico = [];
}
