/*
  gerar-tutoriais.mjs — Monta os arquivos do modo Tutorial.

  Para cada exercicio em ferramentas/exercicios.mjs:
    1. executa o programa correto num grid em branco e guarda a arte alvo
    2. converte a arvore em blocos, para a versao em Blockly
    3. aplica as mutacoes e gera a versao inicial, com erros, nas duas linguagens
    4. escreve tudo em ATIVIDADES/tutorial/<categoria>/

  Uso: node ferramentas/gerar-tutoriais.mjs
*/

import { writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const { EXERCICIOS } = await import(join(RAIZ, 'ferramentas/exercicios.mjs'));
const { arteVazia } = await import(join(RAIZ, 'js/nucleo/catalogo.js'));
const { ModeloGrid } = await import(join(RAIZ, 'js/grid/modelo.js'));
const { Runtime } = await import(join(RAIZ, 'js/exec/api-pixel.js'));
const { interpretar } = await import(join(RAIZ, 'js/portugol/interpretador.js'));
const { portugolParaBlocos } = await import(join(RAIZ, 'js/portugol/para-blocos.js'));

const PREFIXO = { repeticao: 'tut-rep', condicao: 'tut-cond', procedimento: 'tut-proc' };

function slug(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* Roda o programa e devolve a arte resultante no formato do projeto. */
function desenhar(fonte, tamanho) {
  const modelo = new ModeloGrid(arteVazia(tamanho));
  const P = new Runtime(modelo, { maxPassos: 2000000, maxMs: 60000 });
  P.comecar();
  const r = interpretar(fonte, P);
  if (!r.ok) return { erro: r.erro };
  return { modelo, instrucoes: r.instrucoes };
}

function empacotarArte(modelo, nome, categoria, dica, par) {
  const cores = new Map();      // valor rgb -> indice
  const indices = new Uint8Array(modelo.pintado.length);
  let pintados = 0;
  for (let i = 0; i < modelo.pintado.length; i++) {
    const v = modelo.pintado[i];
    if (v === -1) { indices[i] = 0; continue; }
    if (!cores.has(v)) cores.set(v, cores.size + 1);
    indices[i] = cores.get(v);
    pintados++;
  }
  const paleta = ['transparente'];
  for (const v of cores.keys()) paleta.push('#' + v.toString(16).padStart(6, '0').toUpperCase());

  const partes = [];
  let atual = indices[0], cont = 1;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === atual) cont++;
    else { partes.push(atual + 'x' + cont); atual = indices[i]; cont = 1; }
  }
  partes.push(atual + 'x' + cont);

  return {
    nome, categoria, dica, par,
    largura: modelo.largura,
    altura: modelo.altura,
    paleta,
    pintados,
    pixels: partes.join(','),
  };
}

function aplicarMutacoes(fonte, mutacoes) {
  let saida = fonte;
  for (const [de, para] of mutacoes) {
    if (!saida.includes(de)) {
      throw new Error('a mutacao nao encontrou o trecho: ' + JSON.stringify(de));
    }
    saida = saida.replace(de, para);
  }
  return saida;
}

/* ---------------------------------------------------------------- main */

const contador = { repeticao: 0, condicao: 0, procedimento: 0 };
let escritos = 0;
const problemas = [];

for (const cat of Object.keys(PREFIXO)) {
  const pasta = join(RAIZ, 'ATIVIDADES', 'tutorial', cat);
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });
  for (const f of readdirSync(pasta)) if (f.endsWith('.json')) unlinkSync(join(pasta, f));
}

for (const ex of EXERCICIOS) {
  const rotulo = ex.categoria + ' / ' + ex.nome;

  const certo = desenhar(ex.fonte, ex.tamanho);
  if (certo.erro) { problemas.push(rotulo + ' — solucao nao roda: ' + certo.erro); continue; }
  if (certo.modelo.pintado.every((v) => v === -1)) {
    problemas.push(rotulo + ' — a solucao nao pintou nada');
    continue;
  }

  let fonteInicial;
  try {
    fonteInicial = aplicarMutacoes(ex.fonte, ex.mutacoes);
  } catch (e) {
    problemas.push(rotulo + ' — ' + e.message);
    continue;
  }

  // O codigo inicial precisa ao menos ser valido para o aluno poder editar.
  const quebrado = desenhar(fonteInicial, ex.tamanho);
  if (quebrado.erro && quebrado.erro.includes('SINTAXE')) {
    problemas.push(rotulo + ' — o codigo inicial nao compila: ' + quebrado.erro);
    continue;
  }

  // O codigo inicial precisa estar mesmo diferente do correto.
  if (!quebrado.erro) {
    let igual = true;
    for (let i = 0; i < certo.modelo.pintado.length; i++) {
      if (certo.modelo.pintado[i] !== quebrado.modelo.pintado[i]) { igual = false; break; }
    }
    if (igual) { problemas.push(rotulo + ' — a mutacao nao mudou o desenho'); continue; }
  }

  let blocosSolucao, blocosInicial;
  try {
    blocosSolucao = portugolParaBlocos(ex.fonte);
    blocosInicial = portugolParaBlocos(fonteInicial);
  } catch (e) {
    problemas.push(rotulo + ' — conversao para blocos falhou: ' + e.message);
    continue;
  }

  const par = Math.max(6, Math.round(certo.instrucoes / 1.7));
  const arte = empacotarArte(certo.modelo, ex.nome, ex.categoria, ex.dica, par);

  contador[ex.categoria]++;
  const id = PREFIXO[ex.categoria] + '-' + String(contador[ex.categoria]).padStart(3, '0');
  const registro = {
    id,
    tutorial: true,
    ...arte,
    codigoInicial: { portugol: fonteInicial, blocos: blocosInicial },
    solucao: { portugol: ex.fonte, blocos: blocosSolucao },
  };

  const arquivo = id + '-' + slug(ex.nome) + '.json';
  writeFileSync(join(RAIZ, 'ATIVIDADES', 'tutorial', ex.categoria, arquivo), JSON.stringify(registro));
  escritos++;
  console.log('  ' + arquivo + '   (' + arte.pintados + ' pixels, par ' + par + ')');
}

console.log('\n' + escritos + ' tutoriais gerados.');
for (const c of Object.keys(contador)) console.log('  ' + c + ': ' + contador[c]);
if (problemas.length) {
  console.log('\nProblemas:');
  for (const p of problemas) console.log('  - ' + p);
  process.exit(1);
}
console.log('\nAgora rode: node ferramentas/atualizar-catalogo.mjs');
