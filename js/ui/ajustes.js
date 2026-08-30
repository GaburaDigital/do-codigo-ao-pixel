/* =========================================================================
   ajustes.js — Modais e painel de preferencias.
   ========================================================================= */

import { prefs, salvarPrefs, aplicarTema, limparCache, progresso } from '../nucleo/estado.js';
import { tocar } from './audio.js';
import { glifoSvg } from './icones.js';
import { SIGNIFICADOS, TOTAL_GLIFOS } from '../nucleo/pontuacao.js';

let ultimoFoco = null;

export function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  ultimoFoco = document.activeElement;
  el.classList.remove('oculto');
  const alvo = el.querySelector('input, button, select, textarea');
  if (alvo) alvo.focus();
  tocar('navegar');
}

export function fecharModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('oculto');
  if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
}

export function ligarModais() {
  document.querySelectorAll('[data-fechar]').forEach((btn) => {
    btn.addEventListener('click', () => fecharModal(btn.getAttribute('data-fechar')));
  });
  document.querySelectorAll('.tapa-tela').forEach((tapa) => {
    tapa.addEventListener('mousedown', (ev) => {
      if (ev.target === tapa) fecharModal(tapa.id);
    });
  });
  window.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    const aberto = [...document.querySelectorAll('.tapa-tela')].find((t) => !t.classList.contains('oculto'));
    if (aberto) fecharModal(aberto.id);
  });
}

/* ------------------------------------------------------------- ajustes */

export function ligarAjustes({ aoMudarTema, aoMudarAnimacao }) {
  const chkSom = document.getElementById('chk-som');
  const chkTema = document.getElementById('chk-tema');
  const chkEfeitos = document.getElementById('chk-efeitos');
  const chkAnimar = document.getElementById('chk-animar');
  const chkBoot = document.getElementById('chk-pular-boot');
  const estado = document.getElementById('estado-salvo');

  chkSom.checked = prefs.som;
  chkTema.checked = prefs.tema === 'claro';
  chkEfeitos.checked = prefs.efeitos;
  chkAnimar.checked = prefs.animarDesenho;
  chkBoot.checked = prefs.pularBoot;

  chkSom.addEventListener('change', () => {
    prefs.som = chkSom.checked;
    if (prefs.som) tocar('clique');
  });
  chkTema.addEventListener('change', () => {
    prefs.tema = chkTema.checked ? 'claro' : 'escuro';
    aplicarTema();
    if (aoMudarTema) aoMudarTema();
    tocar('clique');
  });
  chkEfeitos.addEventListener('change', () => {
    prefs.efeitos = chkEfeitos.checked;
    aplicarTema();
  });
  chkAnimar.addEventListener('change', () => {
    prefs.animarDesenho = chkAnimar.checked;
    if (aoMudarAnimacao) aoMudarAnimacao();
  });
  chkBoot.addEventListener('change', () => { prefs.pularBoot = chkBoot.checked; });

  document.getElementById('btn-salvar-prefs').addEventListener('click', () => {
    const ok = salvarPrefs();
    estado.textContent = ok
      ? 'Preferencias salvas neste navegador.'
      : 'Nao consegui salvar. O navegador pode estar em modo privado.';
    estado.className = 'texto-mini ' + (ok ? 'texto-verde' : 'texto-vermelho');
    tocar('acerto');
  });

  document.getElementById('btn-limpar-cache').addEventListener('click', () => {
    const certeza = window.confirm(
      'Isto apaga suas preferencias, sua pontuacao acumulada, as insignias e os glifos decodificados. Continuar?'
    );
    if (!certeza) return;
    limparCache();
    estado.textContent = 'Dados apagados. Recarregue a pagina para comecar do zero.';
    estado.className = 'texto-mini texto-ambar';
    tocar('erro');
  });
}

/* -------------------------------------------------------------- glifos */

export function montarGlifos() {
  const grade = document.getElementById('grade-glifos');
  grade.innerHTML = '';
  for (let i = 0; i < TOTAL_GLIFOS; i++) {
    const tem = progresso.glifos.includes(i);
    const cel = document.createElement('div');
    cel.style.cssText =
      'border:1px solid var(--linha-forte);padding:8px;text-align:center;' +
      'background:var(--painel-fundo);' + (tem ? '' : 'opacity:0.35;');
    cel.innerHTML =
      glifoSvg(i, 30, tem ? 'var(--verde)' : 'var(--texto-fraco)') +
      '<div class="texto-mini" style="margin-top:4px;letter-spacing:0.08em">' +
      (tem ? SIGNIFICADOS[i] : '???') + '</div>';
    grade.appendChild(cel);
  }
}

/* --------------------------------------------------------------- ajuda */

const AJUDA = [
  ['Como funciona', [
    'Voce monta um programa com blocos. Ao executar, um cursor anda pelo grid e pinta os pixels.',
    'O cursor sempre comeca em x igual a zero e y igual a zero, no canto superior esquerdo.',
    'Em x, o valor 1 anda para a direita e -1 para a esquerda. Em y, 1 sobe e -1 desce.',
  ]],
  ['O objetivo', [
    'A arte de referencia aparece transparente por baixo do grid. Reproduza ela com codigo.',
    'Com 75% ou mais voce pode passar para a proxima arte. Completar 100% vale o dobro de pontos.',
    'Pixels pintados com a cor errada ganham um X preto e descontam pontos.',
  ]],
  ['Pontuacao', [
    'A base depende da resolucao: 100 no 32, 250 no 64 e 500 no 128.',
    'Quanto mais rapido, maior o multiplicador de tempo.',
    'Quanto menor o programa em relacao ao tamanho de referencia, maior a Eficiencia de Transmissao e o multiplicador.',
    'Ou seja: quem pinta pixel a pixel na mao faz menos pontos que quem usa repeticoes e procedimentos.',
  ]],
  ['Regras de execucao', [
    'Se o cursor tentar sair do grid, o programa para e nada e desenhado.',
    'Se o programa passar de 300 mil comandos, o sistema interrompe por suspeita de loop infinito.',
    'Programa com erro nao altera o grid.',
  ]],
];

export function montarAjuda() {
  const corpo = document.getElementById('corpo-ajuda');
  corpo.innerHTML = AJUDA.map(([titulo, itens]) =>
    '<div><div class="legenda" style="margin-bottom:6px">' + titulo + '</div>' +
    '<ul class="texto-peq texto-suave" style="display:flex;flex-direction:column;gap:6px">' +
    itens.map((i) => '<li>— ' + i + '</li>').join('') +
    '</ul></div>'
  ).join('<hr class="divisor">');
}
