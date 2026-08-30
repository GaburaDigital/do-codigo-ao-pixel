/* =========================================================================
   audio.js — Avisos sonoros gerados pelo proprio navegador (Web Audio).
   Nenhum arquivo de audio: tudo e sintetizado, o que mantem o site leve.
   Respeita o ajuste "efeitos sonoros" do aluno.
   ========================================================================= */

import { prefs } from '../nucleo/estado.js';

let ctx = null;

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // O Safari e o Chrome comecam suspensos ate a primeira interacao.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function despertarAudio() {
  contexto();
}

function tom({ freq = 440, dur = 0.12, tipo = 'square', volume = 0.05, atraso = 0, deslize = 0 }) {
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + atraso;
  const osc = c.createOscillator();
  const ganho = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  if (deslize) osc.frequency.linearRampToValueAtTime(freq + deslize, t0 + dur);
  ganho.gain.setValueAtTime(0.0001, t0);
  ganho.gain.exponentialRampToValueAtTime(volume, t0 + 0.008);
  ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(ganho).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function ruido({ dur = 0.18, volume = 0.04, atraso = 0, corte = 1200 }) {
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + atraso;
  const amostras = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, amostras, c.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < amostras; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / amostras);
  const fonte = c.createBufferSource();
  fonte.buffer = buffer;
  const filtro = c.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = corte;
  const ganho = c.createGain();
  ganho.gain.value = volume;
  fonte.connect(filtro).connect(ganho).connect(c.destination);
  fonte.start(t0);
}

const EFEITOS = {
  clique: () => tom({ freq: 660, dur: 0.05, volume: 0.035 }),
  navegar: () => tom({ freq: 420, dur: 0.06, tipo: 'triangle', volume: 0.03 }),
  executar: () => {
    tom({ freq: 300, dur: 0.07, volume: 0.045 });
    tom({ freq: 600, dur: 0.09, volume: 0.04, atraso: 0.05 });
  },
  varredura: () => ruido({ dur: 0.5, volume: 0.022, corte: 900 }),
  acerto: () => {
    tom({ freq: 523, dur: 0.09, volume: 0.05 });
    tom({ freq: 784, dur: 0.11, volume: 0.05, atraso: 0.08 });
  },
  completo: () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      tom({ freq: f, dur: 0.16, volume: 0.05, atraso: i * 0.09, tipo: 'square' }));
    ruido({ dur: 0.6, volume: 0.018, atraso: 0.36, corte: 2400 });
  },
  glifo: () => {
    tom({ freq: 880, dur: 0.5, tipo: 'sine', volume: 0.04, deslize: 420 });
    tom({ freq: 1320, dur: 0.4, tipo: 'sine', volume: 0.02, atraso: 0.12, deslize: -300 });
  },
  erro: () => {
    tom({ freq: 180, dur: 0.22, tipo: 'sawtooth', volume: 0.05 });
    tom({ freq: 120, dur: 0.26, tipo: 'sawtooth', volume: 0.04, atraso: 0.12 });
  },
  aviso: () => tom({ freq: 880, dur: 0.1, volume: 0.045, tipo: 'triangle' }),
  fim: () => {
    [660, 550, 440, 330].forEach((f, i) =>
      tom({ freq: f, dur: 0.2, volume: 0.05, atraso: i * 0.12 }));
  },
  boot: () => {
    tom({ freq: 220, dur: 0.5, tipo: 'sine', volume: 0.03, deslize: 320 });
    ruido({ dur: 0.35, volume: 0.015, corte: 600, atraso: 0.1 });
  },
  bipe: () => tom({ freq: 1200, dur: 0.03, volume: 0.02 }),
};

export function tocar(nome) {
  if (!prefs.som) return;
  const efeito = EFEITOS[nome];
  if (!efeito) return;
  try { efeito(); } catch (e) { /* audio indisponivel, seguimos sem som */ }
}
