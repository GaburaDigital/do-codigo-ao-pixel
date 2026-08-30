/*
  testar-motor.mjs — Verificacao do motor de execucao sem navegador.
  Roda programas de exemplo contra artes reais e confere o resultado.

  Uso: node ferramentas/testar-motor.mjs
*/

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const { prepararArte } = await import(join(RAIZ, 'js/nucleo/catalogo.js'));
const { ModeloGrid } = await import(join(RAIZ, 'js/grid/modelo.js'));
const { executar } = await import(join(RAIZ, 'js/exec/executor.js'));
const { calcularPontos, eficienciaTransmissao } = await import(join(RAIZ, 'js/nucleo/pontuacao.js'));

let falhas = 0;
function conferir(rotulo, condicao, detalhe = '') {
  const marca = condicao ? '  ok  ' : ' FALHA';
  if (!condicao) falhas++;
  console.log(marca + '  ' + rotulo + (detalhe ? '   (' + detalhe + ')' : ''));
}

function abrir(caminhoRelativo) {
  return prepararArte(JSON.parse(readFileSync(join(RAIZ, caminhoRelativo), 'utf8')), caminhoRelativo);
}

/* Reproduz a arte alvo pixel a pixel: deve dar sempre 100%. */
function programaForcaBruta(arte) {
  const linhas = [];
  for (let y = 0; y < arte.altura; y++) {
    for (let x = 0; x < arte.largura; x++) {
      const v = arte.alvo[y * arte.largura + x];
      if (v === -1) continue;
      linhas.push('P.irPara(' + x + ',' + y + '); P.pintar([' +
        ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ']);');
    }
  }
  return linhas.join('\n');
}

console.log('\n== 1. Toda arte do catalogo pode ser reproduzida a 100% ==');
const catalogo = JSON.parse(readFileSync(join(RAIZ, 'catalogo.json'), 'utf8'));
let testadas = 0, perfeitas = 0, pior = 100;
for (const nivel of catalogo.niveis) {
  for (const [, lista] of Object.entries(nivel.categorias)) {
    for (const entrada of lista) {
      const arte = abrir(nivel.pasta + '/' + entrada.arquivo);
      const modelo = new ModeloGrid(arte);
      const r = executar(programaForcaBruta(arte), modelo, { maxPassos: 2000000, maxMs: 60000 });
      if (!r.ok) { console.log('   erro em ' + entrada.arquivo + ': ' + r.erro); falhas++; continue; }
      const pct = modelo.percentual();
      testadas++;
      if (pct >= 99.999) perfeitas++;
      pior = Math.min(pior, pct);
    }
  }
}
conferir(testadas + ' artes reproduzidas', perfeitas === testadas,
  'perfeitas: ' + perfeitas + ', pior resultado: ' + pior.toFixed(2) + '%');

console.log('\n== 2. Uma solucao com repeticao vale mais que a forca bruta ==');
const arteListras = abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json');
const modeloA = new ModeloGrid(arteListras);
executar(programaForcaBruta(arteListras), modeloA, { maxPassos: 2000000, maxMs: 60000 });
const bruto = calcularPontos({
  tamanho: 32, percentual: modeloA.percentual(), completa: true, segundos: 60,
  tamanhoCodigo: 900, par: arteListras.par, erros: modeloA.erros,
});
const esperto = calcularPontos({
  tamanho: 32, percentual: 100, completa: true, segundos: 60,
  tamanhoCodigo: arteListras.par, par: arteListras.par, erros: 0,
});
conferir('codigo curto pontua mais', esperto.total > bruto.total,
  'curto: ' + esperto.total + ' vs longo: ' + bruto.total);
conferir('eficiencia do codigo longo e baixa',
  eficienciaTransmissao(900, arteListras.par) < 10);

console.log('\n== 3. Erros de execucao ==');
const modeloB = new ModeloGrid(abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json'));
const fora = executar('P.irPara(0,0); for(let i=0;i<100;i++){P.passo();P.moverX(1);}', modeloB);
conferir('cursor fora do grid e barrado', !fora.ok && fora.tipo === 'limite-grid', fora.erro);

const loop = executar('while(true){P.passo();}', new ModeloGrid(abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json')));
conferir('loop infinito e interrompido', !loop.ok && loop.tipo === 'limite');

const vazio = executar('   ', new ModeloGrid(abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json')));
conferir('programa vazio avisa', !vazio.ok && vazio.tipo === 'vazio');

const sintaxe = executar('P.pintar(naoExiste);', new ModeloGrid(abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json')));
conferir('erro de sintaxe nao quebra a aplicacao', !sintaxe.ok, sintaxe.erro);

console.log('\n== 4. Programa com erro nao altera o grid ==');
const modeloC = new ModeloGrid(abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json'));
executar('P.irPara(5,5); P.pintar([255,0,0]); P.irPara(99,99);', modeloC);
const nadaPintado = modeloC.pintado.every((v) => v === -1);
conferir('grid permanece intacto apos erro', nadaPintado);

console.log('\n== 5. Contagem de acertos e erros ==');
const arteD = abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json');
const modeloD = new ModeloGrid(arteD);
const primeiro = arteD.alvo.findIndex((v) => v !== -1);
const px = primeiro % arteD.largura, py = Math.floor(primeiro / arteD.largura);
executar('P.irPara(' + px + ',' + py + '); P.pintar([1,2,3]);', modeloD);
conferir('cor errada conta como erro', modeloD.erros === 1 && modeloD.acertos === 0);
conferir('percentual continua em zero', modeloD.percentual() === 0);

console.log('\n== 6. Leitura de cor do proprio desenho ==');
const modeloE = new ModeloGrid(abrir('ATIVIDADES/nivel-32/rep-001-listras-horizontais.json'));
const r6 = executar(
  'P.irPara(3,3); P.pintar([59,255,158]); P.irPara(0,0);' +
  'if (P.corIgual(P.pegarCor(3,3), [59,255,158])) { P.pintar([59,255,158]); }',
  modeloE
);
conferir('pegarCor devolve a cor pintada', r6.ok && modeloE.corEm(0, 0) !== -1);

console.log('\n== 7. Tamanho dos arquivos ==');
let maior = 0, soma = 0, n = 0;
for (const nivel of catalogo.niveis) {
  for (const f of readdirSync(join(RAIZ, nivel.pasta))) {
    const t = readFileSync(join(RAIZ, nivel.pasta, f)).length;
    maior = Math.max(maior, t); soma += t; n++;
  }
}
conferir('arte mais pesada abaixo de 32 KB', maior < 32768, Math.round(maior / 1024) + ' KB');
conferir('media abaixo de 8 KB', soma / n < 8192, Math.round(soma / n / 1024 * 10) / 10 + ' KB');

console.log('\n' + (falhas ? falhas + ' verificacao(oes) falharam.' : 'Todas as verificacoes passaram.'));
process.exit(falhas ? 1 : 0);
