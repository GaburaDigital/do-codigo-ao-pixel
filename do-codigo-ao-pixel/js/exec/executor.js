/* =========================================================================
   executor.js — Roda o codigo gerado pelos blocos dentro do runtime.
   O programa so desenha se rodar inteiro sem erro. Qualquer erro
   interrompe a execucao e nada e aplicado no grid.
   ========================================================================= */

import { Runtime, ErroExecucao } from './api-pixel.js';

export function executar(codigo, modelo, opcoes = {}) {
  const runtime = new Runtime(modelo, opcoes);

  if (!codigo || !codigo.trim()) {
    return { ok: false, erro: 'PROGRAMA VAZIO. Monte pelo menos um comando antes de executar.', tipo: 'vazio', runtime };
  }

  const estadoAnterior = modelo.pintado.slice();
  const xAnterior = modelo.x;
  const yAnterior = modelo.y;

  runtime.comecar();

  try {
    // O codigo dos blocos recebe apenas P. Nada mais do escopo fica visivel.
    const fn = new Function('P', '"use strict";\n' + codigo + '\n');
    fn(runtime);
  } catch (e) {
    // Desfaz tudo: execucao com erro nao altera o grid.
    modelo.pintado.set(estadoAnterior);
    modelo.x = xAnterior;
    modelo.y = yAnterior;
    modelo.recontar();
    const erro = e instanceof ErroExecucao
      ? { mensagem: e.message, tipo: e.tipo }
      : { mensagem: 'ERRO NO PROGRAMA: ' + traduzirErro(e), tipo: 'sintaxe' };
    return { ok: false, erro: erro.mensagem, tipo: erro.tipo, runtime };
  }

  modelo.recontar();
  return { ok: true, runtime, trilha: runtime.trilha };
}

function traduzirErro(e) {
  const m = String(e && e.message ? e.message : e);
  if (m.includes('is not defined')) {
    return 'um valor usado no programa nao existe. Verifique as variaveis.';
  }
  if (m.includes('call stack') || m.includes('Maximum call stack')) {
    return 'um procedimento chamou a si mesmo sem parar.';
  }
  if (m.includes('NaN') || m.includes('not a function')) {
    return 'algum encaixe ficou vazio ou recebeu o tipo errado de valor.';
  }
  return m;
}
