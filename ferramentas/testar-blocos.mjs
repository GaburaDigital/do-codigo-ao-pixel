/*
  testar-blocos.mjs — Monta programas de blocos sem navegador, gera o codigo
  e executa contra o grid. Verifica se as definicoes e os geradores estao
  coerentes com a biblioteca pixel.

  Precisa do Blockly instalado localmente:
    npm install blockly
  Se o pacote nao estiver presente, o teste avisa e sai sem falhar.
*/

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let Blockly, javascriptGenerator, Order;
try {
  const pacote = await import('blockly');
  Blockly = pacote.default ?? pacote;
  const en = await import('blockly/msg/en');
  Blockly.setLocale(en.default ?? en);
  const mod = await import('blockly/javascript');
  javascriptGenerator = mod.javascriptGenerator;
  Order = mod.Order;
} catch (e) {
  console.log('Blockly nao encontrado no node_modules. Rode "npm install blockly" para usar este teste.');
  process.exit(0);
}

const { registrarBlocos, registrarGeradores } = await import(join(RAIZ, 'js/blocos/definicoes.js'));
const { prepararArte } = await import(join(RAIZ, 'js/nucleo/catalogo.js'));
const { ModeloGrid } = await import(join(RAIZ, 'js/grid/modelo.js'));
const { executar } = await import(join(RAIZ, 'js/exec/executor.js'));

registrarBlocos(Blockly);
registrarGeradores(javascriptGenerator, Order);
javascriptGenerator.INFINITE_LOOP_TRAP = 'P.passo();\n';

let falhas = 0;
const conferir = (rotulo, cond, detalhe = '') => {
  if (!cond) falhas++;
  console.log((cond ? '  ok  ' : ' FALHA') + '  ' + rotulo + (detalhe ? '   (' + detalhe + ')' : ''));
};

function codigoDe(estado) {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(estado, ws);
  const codigo = javascriptGenerator.workspaceToCode(ws);
  const blocos = ws.getAllBlocks(false).filter((b) => !b.isShadow()).length;
  ws.dispose();
  return { codigo, blocos };
}

const numero = (n) => ({ shadow: { type: 'math_number', fields: { NUM: n } } });
const cor = (hex) => ({ shadow: { type: 'pixel_cor', fields: { COR: hex } } });

console.log('\n== Blocos basicos geram a chamada certa ==');
const simples = codigoDe({
  blocks: {
    blocks: [{
      type: 'pixel_ir_para', x: 0, y: 0,
      inputs: { X: numero(3), Y: numero(4) },
      next: {
        block: {
          type: 'pixel_pintar',
          inputs: { COR: cor('#3BFF9E') },
          next: { block: { type: 'pixel_mover_x', inputs: { NUM: numero(1) } } },
        },
      },
    }],
  },
});
conferir('gera P.irPara', simples.codigo.includes('P.irPara(3, 4)'));
conferir('gera P.pintar com lista RGB', simples.codigo.includes('P.pintar([59,255,158])'));
conferir('gera P.moverX', simples.codigo.includes('P.moverX(1)'));

console.log('\n== Programa com repeticao desenha de verdade ==');
const arte = prepararArte(JSON.parse(readFileSync(
  join(RAIZ, 'ATIVIDADES/nivel-32/rep-001-listras-horizontais.json'), 'utf8')));
const modelo = new ModeloGrid(arte);

const comLaco = codigoDe({
  blocks: {
    blocks: [{
      type: 'controls_repeat_ext', x: 0, y: 0,
      inputs: {
        TIMES: numero(32),
        DO: {
          block: {
            type: 'pixel_pintar',
            inputs: { COR: cor('#3BFF9E') },
            next: { block: { type: 'pixel_mover_x', inputs: { NUM: numero(1) } } },
          },
        },
      },
    }],
  },
});
// A ultima iteracao empurraria o cursor para fora: 31 repeticoes cabem.
const ajustado = comLaco.codigo.replace('count < 32', 'count < 31');
const r = executar(ajustado, modelo);
conferir('executa sem erro', r.ok, r.erro || '');
conferir('pintou 31 pixels', modelo.acertos + modelo.erros === 31,
  'acertos ' + modelo.acertos + ', erros ' + modelo.erros);
conferir('a armadilha de loop foi inserida', comLaco.codigo.includes('P.passo()'));

console.log('\n== Bloco de condicao com comparacao de cor ==');
const condicional = codigoDe({
  blocks: {
    blocks: [{
      type: 'controls_if', x: 0, y: 0,
      inputs: {
        IF0: {
          block: {
            type: 'pixel_cores_iguais',
            inputs: {
              A: { block: { type: 'pixel_pegar_cor', inputs: { X: numero(0), Y: numero(0) } } },
              B: cor('#3BFF9E'),
            },
          },
        },
        DO0: { block: { type: 'pixel_pintar', inputs: { COR: cor('#4DE1FF') } } },
      },
    }],
  },
});
conferir('gera P.corIgual', condicional.codigo.includes('P.corIgual('));
conferir('gera P.pegarCor', condicional.codigo.includes('P.pegarCor(0, 0)'));

const modelo2 = new ModeloGrid(arte);
const r2 = executar(condicional.codigo, modelo2);
conferir('condicao executa sem erro', r2.ok, r2.erro || '');

console.log('\n== Reporters de posicao e tamanho ==');
const reporters = codigoDe({
  blocks: {
    blocks: [{
      type: 'pixel_ir_para', x: 0, y: 0,
      inputs: {
        X: { block: { type: 'pixel_posicao_x' } },
        Y: { block: { type: 'pixel_altura' } },
      },
    }],
  },
});
conferir('gera P.posicaoX', reporters.codigo.includes('P.posicaoX()'));
conferir('gera P.altura', reporters.codigo.includes('P.altura()'));

console.log('\n' + (falhas ? falhas + ' verificacao(oes) falharam.' : 'Todas as verificacoes passaram.'));
process.exit(falhas ? 1 : 0);
