/* =========================================================================
   boot.js — Sequencia de inicializacao. Cerca de 4 segundos, com opcao de
   pular a qualquer momento (tecla, clique ou toque).
   ========================================================================= */

import { prefs } from '../nucleo/estado.js';
import { tocar, despertarAudio } from './audio.js';

const LINHAS = [
  { t: 'SISTEMA DE TREINAMENTO DE CADETES  v1.0', c: '' },
  { t: 'NAVE-ESCOLA  ORION-9  //  SETOR DE INSTRUCAO', c: 'ok' },
  { t: '', c: '' },
  { t: 'Verificando nucleo de processamento .......... OK', c: 'ok' },
  { t: 'Montando memoria de video ................... OK', c: 'ok' },
  { t: 'Carregando biblioteca PIXEL ................. OK', c: 'ok' },
  { t: 'Sincronizando relogio da nave ............... OK', c: 'ok' },
  { t: 'Abrindo canal de transmissao ................ OK', c: 'ok' },
  { t: '', c: '' },
  { t: 'AVISO: sinal de origem desconhecida no canal 7', c: 'alien' },
  { t: 'DECODIFICANDO ...', c: 'alien' },
  { t: '', c: '' },
  { t: 'Modulo de arte alienigena acoplado ao sistema.', c: '' },
  { t: 'IA de bordo NOVA-7 em linha.', c: 'ok' },
  { t: '', c: '' },
  { t: 'Pronto para receber o cadete.', c: 'ok' },
];

export function rodarBoot(aoTerminar) {
  const tela = document.getElementById('boot');
  const registro = document.getElementById('boot-registro');

  if (prefs.pularBoot) {
    tela.remove();
    aoTerminar();
    return;
  }

  let indice = 0;
  let encerrado = false;
  let timer = null;

  const encerrar = () => {
    if (encerrado) return;
    encerrado = true;
    clearTimeout(timer);
    tela.style.transition = 'opacity 220ms linear';
    tela.style.opacity = '0';
    setTimeout(() => { tela.remove(); aoTerminar(); }, 220);
  };

  const proxima = () => {
    if (encerrado) return;
    if (indice >= LINHAS.length) {
      timer = setTimeout(encerrar, 500);
      return;
    }
    const linha = LINHAS[indice++];
    const el = document.createElement('div');
    if (linha.c) el.className = linha.c;
    el.textContent = linha.t || '\u00A0';
    registro.appendChild(el);
    registro.scrollTop = registro.scrollHeight;
    if (linha.t) tocar('bipe');
    timer = setTimeout(proxima, linha.t === '' ? 60 : 175);
  };

  // O primeiro gesto do usuario tambem libera o audio nos navegadores.
  const pular = () => { despertarAudio(); encerrar(); };
  tela.addEventListener('click', pular);
  tela.addEventListener('touchstart', pular, { passive: true });
  window.addEventListener('keydown', pular, { once: true });

  tocar('boot');
  proxima();
}
