/*
  testar-tutoriais.mjs — Confere, para cada exercicio do modo Tutorial:
    - a solucao em Portugol reproduz a arte a 100%
    - a solucao em blocos reproduz a mesma arte a 100%
    - o codigo inicial NAO reproduz (senao nao haveria o que consertar)
    - o codigo inicial em blocos e igual ao codigo inicial em Portugol

  Uso: node ferramentas/testar-tutoriais.mjs   (precisa de: npm install blockly)
*/

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let Blockly, javascriptGenerator, Order;
try {
  const pacote = await import('blockly');
  Blockly = pacote.default ?? pacote;
  const en = await import('blockly/msg/en');
  Blockly.setLocale(en.default ?? en);
  const jsmod = await import('blockly/javascript');
  javascriptGenerator = jsmod.javascriptGenerator;
  Order = jsmod.Order;
} catch (e) {
  console.log('Blockly nao encontrado. Rode "npm install blockly" para usar este teste.');
  process.exit(0);
}

const { registrarBlocos, registrarGeradores } = await import(join(RAIZ, 'js/blocos/definicoes.js'));
const { prepararArte, arteVazia } = await import(join(RAIZ, 'js/nucleo/catalogo.js'));
const { ModeloGrid } = await import(join(RAIZ, 'js/grid/modelo.js'));
const { Runtime } = await import(join(RAIZ, 'js/exec/api-pixel.js'));
const { interpretar } = await import(join(RAIZ, 'js/portugol/interpretador.js'));
const { executar } = await import(join(RAIZ, 'js/exec/executor.js'));

registrarBlocos(Blockly);
registrarGeradores(javascriptGenerator, Order);
javascriptGenerator.INFINITE_LOOP_TRAP = 'P.passo();\n';

const OPCOES = { maxPassos: 2000000, maxMs: 60000 };

function rodarPortugol(fonte, arte) {
  const modelo = new ModeloGrid(arte);
  const P = new Runtime(modelo, OPCOES);
  P.comecar();
  const r = interpretar(fonte, P);
  modelo.recontar();
  return { modelo, ok: r.ok, erro: r.erro };
}

function rodarBlocos(estado, arte) {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(estado, ws);
  const codigo = javascriptGenerator.workspaceToCode(ws);
  const blocos = ws.getAllBlocks(false).filter((b) => !b.isShadow()).length;
  ws.dispose();
  const modelo = new ModeloGrid(arte);
  const r = executar(codigo, modelo, OPCOES);
  return { modelo, ok: r.ok, erro: r.erro, blocos };
}

const mesmoDesenho = (a, b) => {
  for (let i = 0; i < a.pintado.length; i++) if (a.pintado[i] !== b.pintado[i]) return false;
  return true;
};

let falhas = 0, total = 0;
for (const categoria of ['repeticao', 'condicao', 'procedimento']) {
  const pasta = join(RAIZ, 'ATIVIDADES', 'tutorial', categoria);
  console.log('\n== ' + categoria + ' ==');
  for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith('.json')).sort()) {
    total++;
    const dados = JSON.parse(readFileSync(join(pasta, arquivo), 'utf8'));
    const arte = prepararArte(dados, arquivo);
    const problemas = [];

    const solP = rodarPortugol(dados.solucao.portugol, arte);
    if (!solP.ok) problemas.push('portugol: ' + solP.erro);
    else if (!solP.modelo.completa()) {
      problemas.push('portugol chegou a ' + solP.modelo.percentual().toFixed(1) +
        '% com ' + solP.modelo.erros + ' erro(s)');
    }

    const solB = rodarBlocos(dados.solucao.blocos, arte);
    if (!solB.ok) problemas.push('blocos: ' + solB.erro);
    else if (!solB.modelo.completa()) {
      problemas.push('blocos chegou a ' + solB.modelo.percentual().toFixed(1) +
        '% com ' + solB.modelo.erros + ' erro(s)');
    }

    const iniP = rodarPortugol(dados.codigoInicial.portugol, arte);
    if (iniP.ok && iniP.modelo.completa()) {
      problemas.push('o codigo inicial ja resolve o exercicio');
    }

    const iniB = rodarBlocos(dados.codigoInicial.blocos, arte);
    if (iniP.ok && iniB.ok && !mesmoDesenho(iniP.modelo, iniB.modelo)) {
      problemas.push('codigo inicial difere entre portugol e blocos');
    }

    if (problemas.length) {
      falhas++;
      console.log(' FALHA  ' + dados.nome);
      for (const p of problemas) console.log('           ' + p);
    } else {
      console.log('  ok    ' + dados.nome.padEnd(30) +
        ' par ' + String(dados.par).padStart(3) +
        '  solucao ' + String(solB.blocos).padStart(3) + ' blocos' +
        '  inicial ' + (iniP.ok ? iniP.modelo.percentual().toFixed(0) + '%' : 'erro'));
    }
  }
}

console.log('\n' + total + ' tutoriais testados. ' +
  (falhas ? falhas + ' com problema.' : 'Todos funcionam nas duas linguagens.'));
process.exit(falhas ? 1 : 0);
