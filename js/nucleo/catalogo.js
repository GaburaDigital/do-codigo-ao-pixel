/* =========================================================================
   catalogo.js — Le o catalogo.json, sorteia artes e decodifica o RLE.
   ========================================================================= */

let catalogo = null;
const cacheArtes = new Map();
const recentes = [];          // evita repetir a mesma arte logo em seguida
const LIMITE_RECENTES = 12;

export async function carregarCatalogo() {
  if (catalogo) return catalogo;
  const resposta = await fetch('catalogo.json', { cache: 'no-cache' });
  if (!resposta.ok) throw new Error('Nao consegui ler o catalogo.json (' + resposta.status + ')');
  catalogo = await resposta.json();
  return catalogo;
}

export function nivelDe(tamanho) {
  if (!catalogo) return null;
  return catalogo.niveis.find((n) => n.tamanho === Number(tamanho)) || null;
}

/* Devolve a lista de entradas do nivel para o foco escolhido. */
export function listarArtes(tamanho, foco = 'geral') {
  const nivel = nivelDe(tamanho);
  if (!nivel) return [];
  if (foco && foco !== 'geral' && nivel.categorias[foco]) {
    return nivel.categorias[foco].map((a) => ({ ...a, pasta: nivel.pasta }));
  }
  return Object.values(nivel.categorias)
    .flat()
    .map((a) => ({ ...a, pasta: nivel.pasta }));
}

export function sortearEntrada(tamanho, foco) {
  const lista = listarArtes(tamanho, foco);
  if (!lista.length) return null;
  const disponiveis = lista.filter((a) => !recentes.includes(a.pasta + '/' + a.arquivo));
  const pool = disponiveis.length ? disponiveis : lista;
  const escolhida = pool[Math.floor(Math.random() * pool.length)];
  const caminho = escolhida.pasta + '/' + escolhida.arquivo;
  recentes.push(caminho);
  while (recentes.length > LIMITE_RECENTES) recentes.shift();
  return escolhida;
}

/* ------------------------------------------------------------- tutorial */

export function listarTutoriais(foco = 'geral') {
  if (!catalogo || !catalogo.tutorial) return [];
  const grupos = foco && foco !== 'geral'
    ? [[foco, catalogo.tutorial[foco]]]
    : Object.entries(catalogo.tutorial);
  const saida = [];
  for (const [categoria, grupo] of grupos) {
    if (!grupo) continue;
    for (const a of grupo.artes) saida.push({ ...a, categoria, pasta: grupo.pasta });
  }
  return saida;
}

export async function carregarTutorial(entrada) {
  const caminho = entrada.pasta + '/' + entrada.arquivo;
  const resposta = await fetch(caminho, { cache: 'force-cache' });
  if (!resposta.ok) throw new Error('Tutorial nao encontrado: ' + caminho);
  const dados = await resposta.json();
  const arte = prepararArte(dados, caminho);
  arte.tutorial = true;
  arte.codigoInicial = dados.codigoInicial;
  arte.solucao = dados.solucao;
  return arte;
}

/* Sorteia um tutorial ainda nao visto nesta sessao. */
const tutoriaisVistos = new Set();
export async function sortearTutorial(foco) {
  const lista = listarTutoriais(foco);
  if (!lista.length) throw new Error('Nenhum tutorial disponivel.');
  let pool = lista.filter((a) => !tutoriaisVistos.has(a.pasta + '/' + a.arquivo));
  if (!pool.length) { tutoriaisVistos.clear(); pool = lista; }
  const escolhida = pool[Math.floor(Math.random() * pool.length)];
  tutoriaisVistos.add(escolhida.pasta + '/' + escolhida.arquivo);
  return carregarTutorial(escolhida);
}

export async function carregarArte(entrada) {
  const caminho = entrada.pasta + '/' + entrada.arquivo;
  if (cacheArtes.has(caminho)) return cacheArtes.get(caminho);
  const resposta = await fetch(caminho, { cache: 'force-cache' });
  if (!resposta.ok) throw new Error('Arte nao encontrada: ' + caminho);
  const dados = await resposta.json();
  const arte = prepararArte(dados, caminho);
  cacheArtes.set(caminho, arte);
  return arte;
}

export async function sortearArte(tamanho, foco) {
  const entrada = sortearEntrada(tamanho, foco);
  if (!entrada) throw new Error('Nenhuma arte disponivel para este nivel.');
  return carregarArte(entrada);
}

/* --------------------------------------------------------- decodificacao */

export function hexParaRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbParaInteiro(r, g, b) {
  return ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);
}

export function inteiroParaRgb(v) {
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function inteiroParaHex(v) {
  return '#' + v.toString(16).padStart(6, '0').toUpperCase();
}

function expandirRle(texto, total) {
  const saida = new Uint8Array(total);
  let p = 0;
  for (const trecho of texto.split(',')) {
    const corte = trecho.indexOf('x');
    const indice = Number(trecho.slice(0, corte));
    const vezes = Number(trecho.slice(corte + 1));
    for (let i = 0; i < vezes && p < total; i++) saida[p++] = indice;
  }
  return saida;
}

/*
  Monta a estrutura usada pelo resto da aplicacao:
    indices  -> indice da paleta por pixel
    alvo     -> inteiro RGB por pixel, ou -1 para transparente
    coresRgb -> as cores usadas, sem o transparente
*/
export function prepararArte(dados, caminho = '') {
  const total = dados.largura * dados.altura;
  const indices = expandirRle(dados.pixels, total);
  const paletaInt = dados.paleta.map((c) =>
    c === 'transparente' ? -1 : rgbParaInteiro(...hexParaRgb(c))
  );
  const alvo = new Int32Array(total);
  let pintados = 0;
  for (let i = 0; i < total; i++) {
    alvo[i] = paletaInt[indices[i]] ?? -1;
    if (alvo[i] !== -1) pintados++;
  }
  return {
    caminho,
    id: dados.id || '',
    nome: dados.nome || 'Sem nome',
    categoria: dados.categoria || '',
    receita: dados.receita || '',
    largura: dados.largura,
    altura: dados.altura,
    par: dados.par || 12,
    dica: dados.dica || '',
    paletaHex: dados.paleta,
    coresRgb: paletaInt.filter((v) => v !== -1),
    alvo,
    pintados: dados.pintados || pintados,
  };
}

/* Cria uma arte em branco, usada pelo modo Desenho Livre. */
export function arteVazia(tamanho) {
  return {
    caminho: '',
    id: 'livre',
    nome: 'Tela Livre',
    categoria: 'livre',
    largura: tamanho,
    altura: tamanho,
    par: 0,
    dica: '',
    paletaHex: ['transparente'],
    coresRgb: [],
    alvo: new Int32Array(tamanho * tamanho).fill(-1),
    pintados: 0,
  };
}
