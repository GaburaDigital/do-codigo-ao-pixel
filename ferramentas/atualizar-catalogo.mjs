/*
  atualizar-catalogo.mjs — Varre a pasta ATIVIDADES e reescreve o catalogo.json.

  Uso:
    node ferramentas/atualizar-catalogo.mjs

  Voce nunca precisa editar o catalogo na mao. Adicione arquivos .json de arte
  dentro de ATIVIDADES/nivel-XX/ e rode este comando.

  Se voce quiser fixar algum campo na mao, coloque "manual": true dentro do
  JSON da arte. O script preserva os campos desse arquivo sem recalcular nada.
*/

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ATIVIDADES = join(RAIZ, 'ATIVIDADES');
const SAIDA = join(RAIZ, 'catalogo.json');

const NIVEIS = [
  { tamanho: 32, pasta: 'nivel-32', rotulo: '32 x 32', patente: 'Sonda Leve' },
  { tamanho: 64, pasta: 'nivel-64', rotulo: '64 x 64', patente: 'Cruzador' },
  { tamanho: 128, pasta: 'nivel-128', rotulo: '128 x 128', patente: 'Nave Capital' },
];

const CATEGORIAS = [
  { id: 'repeticao', rotulo: 'Repeticoes', prefixo: 'rep' },
  { id: 'condicao', rotulo: 'Condicoes', prefixo: 'cond' },
  { id: 'procedimento', rotulo: 'Procedimentos', prefixo: 'proc' },
];

const avisos = [];

function lerArtes(caminhoPasta, relativo) {
  if (!existsSync(caminhoPasta)) { avisos.push('Pasta ausente: ' + relativo); return []; }
  const arquivos = readdirSync(caminhoPasta).filter((f) => f.endsWith('.json')).sort();
  const itens = [];
  for (const arquivo of arquivos) {
    let dados;
    try {
      dados = JSON.parse(readFileSync(join(caminhoPasta, arquivo), 'utf8'));
    } catch (e) {
      avisos.push('JSON invalido, arquivo ignorado: ' + relativo + '/' + arquivo);
      continue;
    }
    const faltando = ['largura', 'altura', 'paleta', 'pixels'].filter((k) => dados[k] === undefined);
    if (faltando.length) {
      avisos.push('Campos ausentes (' + faltando.join(', ') + ') em ' + relativo + '/' + arquivo);
      continue;
    }
    itens.push({
      arquivo,
      nome: dados.nome || arquivo.replace(/\.json$/, ''),
      categoria: dados.categoria || null,
      manual: dados.manual === true,
    });
  }
  return itens;
}

const catalogo = {
  projeto: 'Do Codigo ao Pixel',
  versaoCatalogo: 1,
  atualizadoEm: new Date().toISOString().slice(0, 10),
  niveis: [],
  tutorial: {},
};

for (const nivel of NIVEIS) {
  const registro = {
    tamanho: nivel.tamanho,
    rotulo: nivel.rotulo,
    patente: nivel.patente,
    pasta: 'ATIVIDADES/' + nivel.pasta,
    categorias: {},
    total: 0,
  };
  const todas = lerArtes(join(ATIVIDADES, nivel.pasta), 'ATIVIDADES/' + nivel.pasta);
  for (const cat of CATEGORIAS) {
    const doGrupo = todas.filter(
      (a) => a.categoria === cat.id || (!a.categoria && a.arquivo.startsWith(cat.prefixo + '-'))
    );
    registro.categorias[cat.id] = doGrupo.map(({ manual, categoria, ...resto }) => resto);
    registro.total += doGrupo.length;
  }
  const soltas = todas.filter((a) => !CATEGORIAS.some((c) => a.categoria === c.id || a.arquivo.startsWith(c.prefixo + '-')));
  if (soltas.length) {
    registro.categorias.outras = soltas.map(({ manual, categoria, ...resto }) => resto);
    registro.total += soltas.length;
  }
  catalogo.niveis.push(registro);
}

for (const cat of CATEGORIAS) {
  const rel = 'ATIVIDADES/tutorial/' + cat.id;
  catalogo.tutorial[cat.id] = {
    pasta: rel,
    artes: lerArtes(join(ATIVIDADES, 'tutorial', cat.id), rel)
      .map(({ manual, categoria, ...resto }) => resto),
  };
}

writeFileSync(SAIDA, JSON.stringify(catalogo, null, 1));

console.log('catalogo.json atualizado.');
for (const n of catalogo.niveis) {
  const detalhe = Object.entries(n.categorias).map(([k, v]) => `${k}: ${v.length}`).join(', ');
  console.log(`  ${n.rotulo} -> ${n.total} artes (${detalhe})`);
}
const tut = Object.entries(catalogo.tutorial).map(([k, v]) => `${k}: ${v.artes.length}`).join(', ');
console.log(`  tutorial -> ${tut}`);
if (avisos.length) {
  console.log('\nAvisos:');
  for (const a of avisos) console.log('  - ' + a);
}
