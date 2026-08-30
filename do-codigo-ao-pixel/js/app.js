/* =========================================================================
   app.js — Controlador principal. Amarra configuracao, treino, execucao,
   pontuacao e relatorio.
   ========================================================================= */

import {
  prefs, salvarPrefs, aplicarTema, progresso, salvarProgresso,
  sessao, zerarSessao,
} from './nucleo/estado.js';
import {
  carregarCatalogo, sortearArte, arteVazia, listarArtes, inteiroParaHex,
  sortearTutorial, listarTutoriais, prepararArte,
} from './nucleo/catalogo.js';
import { Cronometro } from './nucleo/cronometro.js';
import {
  calcularPontos, patenteDe, avaliarInsignias, sortearGlifoNovo,
  eficienciaTransmissao, SIGNIFICADOS, INSIGNIAS,
} from './nucleo/pontuacao.js';
import { ModeloGrid } from './grid/modelo.js';
import { RenderGrid } from './grid/render.js';
import { executar } from './exec/executor.js';
import { Reprodutor } from './exec/reprodutor.js';
import * as oficina from './blocos/oficina.js';
import { aplicarIcones, frisoAlien, glifoSvg, icone } from './ui/icones.js';
import { tocar, despertarAudio } from './ui/audio.js';
import { rodarBoot } from './ui/boot.js';
import { ligarNova, nova, novaLivre } from './ui/nova.js';
import {
  ligarModais, ligarAjustes, abrirModal, fecharModal, montarGlifos, montarAjuda,
} from './ui/ajustes.js';
import { baixarCartao } from './ui/relatorio.js';
import { modo as descritorModo } from './modos/modos.js';
import { interpretar } from './portugol/interpretador.js';
import { MODELO_INICIAL, montarDocumentacao } from './portugol/documentacao.js';
import { lerImagem, converter, miniatura } from './modos/importada.js';
import { Runtime } from './exec/api-pixel.js';

const $ = (id) => document.getElementById(id);

let modelo = null;
let render = null;
let reprodutor = null;
let cronometro = null;
let oficinaPronta = false;
let modoAtual = descritorModo(prefs.modo);
let observadorTamanho = null;
let jaExecutouNaArte = false;
let artesImportadas = [];
let filaImportadas = [];
let respostaRevelada = false;

/* ====================================================== inicializacao */

aplicarTema();
aplicarIcones();
$('friso-config').innerHTML = frisoAlien(26);
ligarNova($('nova-texto'));
ligarModais();
montarAjuda();

rodarBoot(async () => {
  try {
    await carregarCatalogo();
    atualizarResumoCatalogo();
  } catch (e) {
    $('resumo-catalogo').textContent = 'Falha ao ler o catalogo.json. Rode a ferramenta de atualizacao.';
    $('resumo-catalogo').className = 'texto-mini texto-vermelho';
  }
  prepararConfiguracao();
  prepararCabecalho();
  prepararTreino();
  registrarServiceWorker();
});

/* ====================================================== configuracao */

function atualizarResumoCatalogo() {
  const el = $('resumo-catalogo');
  el.className = 'texto-mini texto-suave';
  if (modoAtual.id === 'tutorial') {
    el.textContent = listarTutoriais('geral').length + ' exercicios de tutorial disponiveis.';
    return;
  }
  if (modoAtual.precisaImagens) {
    el.textContent = artesImportadas.length
      ? artesImportadas.length + ' imagem(ns) prontas para o treino.'
      : 'Envie ao menos uma imagem para comecar.';
    return;
  }
  if (modoAtual.id === 'livre') { el.textContent = 'Grid limpo, sem alvo e sem cronometro.'; return; }
  const total = [32, 64, 128].reduce((s, t) => s + listarArtes(t, 'geral').length, 0);
  el.textContent = total + ' artes disponiveis no catalogo.';
}

function prepararConfiguracao() {
  $('sel-tamanho').value = String(prefs.tamanho);
  $('sel-foco').value = prefs.foco;
  $('rng-minutos').value = String(prefs.minutos);
  $('lbl-minutos').textContent = String(prefs.minutos);
  $('chk-infinito').checked = prefs.tempoInfinito;

  document.querySelectorAll('[data-modo]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.modo === prefs.modo));
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      prefs.modo = btn.dataset.modo;
      modoAtual = descritorModo(prefs.modo);
      document.querySelectorAll('[data-modo]').forEach((o) =>
        o.setAttribute('aria-pressed', String(o.dataset.modo === prefs.modo)));
      refletirModoNaConfig();
      tocar('navegar');
    });
  });

  $('sel-tamanho').addEventListener('change', (e) => { prefs.tamanho = Number(e.target.value); });
  $('sel-foco').addEventListener('change', (e) => { prefs.foco = e.target.value; });
  $('rng-minutos').addEventListener('input', (e) => {
    prefs.minutos = Number(e.target.value);
    $('lbl-minutos').textContent = String(prefs.minutos);
  });
  $('chk-infinito').addEventListener('change', (e) => { prefs.tempoInfinito = e.target.checked; });

  document.querySelectorAll('[data-linguagem]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      prefs.linguagem = btn.dataset.linguagem;
      document.querySelectorAll('[data-linguagem]').forEach((o) =>
        o.setAttribute('aria-pressed', String(o.dataset.linguagem === prefs.linguagem)));
    });
  });

  document.querySelectorAll('[data-linguagem]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.linguagem === prefs.linguagem)));

  $('btn-escolher-imagens').addEventListener('click', () => $('inp-imagens').click());
  $('inp-imagens').addEventListener('change', receberImagens);

  $('btn-iniciar').addEventListener('click', () => { despertarAudio(); iniciarTreino(); });
  refletirModoNaConfig();
}

function refletirModoNaConfig() {
  $('grupo-foco').style.display = modoAtual.usaFoco ? '' : 'none';
  $('grupo-tempo').style.display = modoAtual.comCronometro ? '' : 'none';
  $('grupo-importar').classList.toggle('oculto', !modoAtual.precisaImagens);
  atualizarResumoCatalogo();
}

/* --------------------------------------------------- imagens do aluno */

async function receberImagens(evento) {
  const arquivos = [...evento.target.files];
  evento.target.value = '';
  if (!arquivos.length) return;

  const resumo = $('resumo-importadas');
  resumo.textContent = 'Convertendo ' + arquivos.length + ' imagem(ns)...';
  resumo.className = 'texto-mini texto-suave';

  const novas = [];
  const erros = [];
  for (const arquivo of arquivos) {
    try {
      const img = await lerImagem(arquivo);
      novas.push(prepararArte(converter(img, prefs.tamanho, arquivo.name)));
    } catch (e) {
      erros.push(e.message);
    }
  }
  artesImportadas = [...artesImportadas, ...novas];

  const tira = $('tira-importadas');
  tira.innerHTML = '';
  artesImportadas.forEach((arte) => {
    const cartao = document.createElement('figure');
    cartao.style.cssText = 'margin:0;text-align:center;width:64px';
    cartao.innerHTML =
      '<img src="' + miniatura({
        largura: arte.largura, altura: arte.altura,
        paleta: arte.paletaHex, pixels: recomprimir(arte),
      }, 56) + '" width="56" height="56" alt="' + arte.nome +
      '" style="image-rendering:pixelated;border:1px solid var(--linha-forte);background:var(--painel-fundo)">' +
      '<figcaption class="texto-mini texto-suave" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      arte.nome + '</figcaption>';
    tira.appendChild(cartao);
  });

  resumo.textContent = artesImportadas.length + ' imagem(ns) prontas.' +
    (erros.length ? ' ' + erros.length + ' falharam.' : '');
  resumo.className = 'texto-mini ' + (artesImportadas.length ? 'texto-verde' : 'texto-vermelho');
  if (erros.length) mostrarErro(erros.join(' '));
  tocar(artesImportadas.length ? 'acerto' : 'erro');
}

/* Reconstroi o RLE a partir da arte ja decodificada, para a miniatura. */
function recomprimir(arte) {
  const indice = new Map();
  arte.paletaHex.forEach((c, i) => {
    if (c === 'transparente') return;
    const v = parseInt(c.slice(1), 16);
    indice.set(v, i);
  });
  const partes = [];
  let atual = null, cont = 0;
  for (let i = 0; i < arte.alvo.length; i++) {
    const v = arte.alvo[i] === -1 ? 0 : (indice.get(arte.alvo[i]) ?? 0);
    if (v === atual) cont++;
    else { if (atual !== null) partes.push(atual + 'x' + cont); atual = v; cont = 1; }
  }
  partes.push(atual + 'x' + cont);
  return partes.join(',');
}

/* ========================================================= cabecalho */

function prepararCabecalho() {
  $('btn-ajustes').addEventListener('click', () => abrirModal('modal-ajustes'));
  $('btn-ajuda').addEventListener('click', () => abrirModal('modal-ajuda'));
  $('btn-glifos').addEventListener('click', () => { montarGlifos(); abrirModal('modal-glifos'); });

  ligarAjustes({
    aoMudarTema: () => {
      oficina.atualizarTema();
      if (render) render.redesenhar();
    },
    aoMudarAnimacao: () => {},
  });

  document.querySelectorAll('[data-aba-alvo]').forEach((btn) => {
    btn.addEventListener('click', () => trocarAba(btn.dataset.abaAlvo));
  });

  atualizarPatente();
}

function trocarAba(aba) {
  $('tela-treino').setAttribute('data-aba', aba);
  document.querySelectorAll('[data-aba-alvo]').forEach((o) =>
    o.setAttribute('aria-pressed', String(o.dataset.abaAlvo === aba)));
  if (aba === 'codigo') oficina.redimensionar();
  else if (render) { render.ajustarTamanho(); render.redesenhar(); }
  tocar('navegar');
}

function atualizarPatente() {
  $('disp-patente').textContent = patenteDe(progresso.pontosTotais).nome;
}

/* ============================================================ treino */

function prepararTreino() {
  cronometro = new Cronometro({
    aoAtualizar: (l) => {
      $('disp-tempo').textContent = modoAtual.comCronometro ? l.texto : 'LIVRE';
      if (!l.infinito && l.restante > 0 && l.restante <= 60 && !sessao.avisou60) {
        sessao.avisou60 = true;
        tocar('aviso');
        nova('tempoAcabando');
      }
    },
    aoTerminar: () => { tocar('fim'); pararTreino({ porTempo: true }); },
  });

  $('btn-rodar').addEventListener('click', () => rodar(false));
  $('btn-lento').addEventListener('click', () => rodar(true));
  $('btn-limpar-codigo').addEventListener('click', () => {
    limparCodigo();
    atualizarSeloBlocos();
    tocar('clique');
  });
  $('btn-resposta').addEventListener('click', mostrarResposta);
  $('btn-docs').addEventListener('click', () => {
    $('corpo-docs').innerHTML = montarDocumentacao();
    abrirModal('modal-docs');
  });
  $('btn-voltar-codigo').addEventListener('click', () => trocarAba('codigo'));
  $('portugol-editor').addEventListener('input', () => {
    // A contagem so vale depois de executar; aqui apenas limpamos o aviso.
    limparErro();
  });
  $('portugol-editor').addEventListener('keydown', (ev) => {
    if (ev.key !== 'Tab') return;
    ev.preventDefault();
    const alvo = ev.target;
    const inicio = alvo.selectionStart;
    alvo.value = alvo.value.slice(0, inicio) + '  ' + alvo.value.slice(alvo.selectionEnd);
    alvo.selectionStart = alvo.selectionEnd = inicio + 2;
  });
  $('btn-ver-relatorio').addEventListener('click', () => {
    fecharModal('modal-tempo');
    montarRelatorio();
    abrirModal('modal-relatorio');
  });
  $('btn-pausar').addEventListener('click', alternarPausa);
  $('btn-reiniciar').addEventListener('click', () => {
    cronometro.reiniciar();
    sessao.avisou60 = false;
    tocar('clique');
  });
  $('btn-parar').addEventListener('click', () => pararTreino());
  $('btn-passar').addEventListener('click', () => passarArte());
  $('btn-baixar-arte').addEventListener('click', baixarDesenho);
  $('btn-ver-alvo').addEventListener('click', () => {
    render.alternarAlvo(!render.mostrarAlvo);
    tocar('clique');
  });
  $('btn-voltar-config').addEventListener('click', () => {
    fecharModal('modal-relatorio');
    voltarParaConfiguracao();
  });
  $('btn-exportar').addEventListener('click', exportarRelatorio);

  window.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter' && sessao.emTreino) {
      ev.preventDefault();
      rodar(false);
    }
  });

  prepararDivisor();
}

async function iniciarTreino() {
  modoAtual = descritorModo(prefs.modo);

  if (modoAtual.precisaImagens && !artesImportadas.length) {
    $('resumo-catalogo').textContent = 'Envie ao menos uma imagem antes de iniciar.';
    $('resumo-catalogo').className = 'texto-mini texto-vermelho';
    tocar('erro');
    return;
  }
  filaImportadas = artesImportadas.slice();

  salvarPrefs();
  zerarSessao();
  sessao.emTreino = true;
  sessao.avisou60 = false;

  $('tela-config').classList.add('oculto');
  $('tela-treino').classList.remove('oculto');

  $('btn-passar').classList.toggle('oculto', !modoAtual.podePassar);
  $('btn-baixar-arte').classList.toggle('oculto', !modoAtual.podeBaixar);
  $('btn-pausar').classList.toggle('oculto', !modoAtual.comCronometro);
  $('btn-reiniciar').classList.toggle('oculto', !modoAtual.comCronometro);
  $('bloco-eficiencia').style.display = modoAtual.comPontos ? '' : 'none';
  $('btn-resposta').classList.toggle('oculto', !modoAtual.temResposta);
  $('btn-docs').classList.toggle('oculto', prefs.linguagem !== 'portugol');
  aplicarLinguagem();

  if (!oficinaPronta) {
    oficina.criarOficina('blockly-div');
    oficinaPronta = true;
    const ws = oficina.obterWorkspace();
    ws.addChangeListener(() => atualizarSeloBlocos());
  }
  oficina.limparBlocos();
  oficina.redimensionar();

  if (!render) {
    modelo = new ModeloGrid(arteVazia(prefs.tamanho));
    render = new RenderGrid($('grid-palco'));
    reprodutor = new Reprodutor(modelo, render);
    observadorTamanho = new ResizeObserver(() => {
      render.ajustarTamanho();
      render.redesenhar();
      espelhar();
    });
    observadorTamanho.observe($('grid-envoltorio'));
    window.addEventListener('resize', () => oficina.redimensionar());
    $('espelho-grid').addEventListener('click', () => trocarAba('grid'));
  }

  $('disp-pontos').textContent = '0';
  $('disp-eficiencia').textContent = '--';

  if (modoAtual.comCronometro) {
    cronometro.iniciar(prefs.minutos * 60, prefs.tempoInfinito);
  } else {
    cronometro.parar();
    $('disp-tempo').textContent = 'LIVRE';
  }

  await proximaArte();
  nova('boasVindas');
  tocar('executar');
}

async function proximaArte() {
  limparErro();
  jaExecutouNaArte = false;
  respostaRevelada = false;
  limparCodigo();
  $('btn-resposta').disabled = false;

  let arte;
  try {
    if (modoAtual.id === 'tutorial') {
      arte = await sortearTutorial(prefs.foco);
    } else if (modoAtual.precisaImagens) {
      if (!filaImportadas.length) filaImportadas = artesImportadas.slice();
      const i = Math.floor(Math.random() * filaImportadas.length);
      arte = filaImportadas.splice(i, 1)[0];
    } else if (modoAtual.comAlvo) {
      arte = await sortearArte(prefs.tamanho, modoAtual.usaFoco ? prefs.foco : 'geral');
    } else {
      arte = arteVazia(prefs.tamanho);
    }
  } catch (e) {
    mostrarErro('Nao consegui carregar a arte: ' + e.message);
    return;
  }

  sessao.arteAtual = arte;
  sessao.inicioArte = performance.now();

  modelo.trocarArte(arte);
  render.ligar(modelo);
  render.alternarAlvo(modoAtual.comAlvo);
  oficina.paletaDaArte(arte.paletaHex);

  $('nome-arte').textContent = modoAtual.comAlvo
    ? arte.nome + '  ·  ' + arte.largura + 'x' + arte.altura
    : 'Tela livre  ·  ' + arte.largura + 'x' + arte.altura;

  render.marcarErros = modoAtual.comAlvo;

  if (modoAtual.codigoPronto && arte.codigoInicial) {
    carregarCodigo(arte.codigoInicial);
  }

  montarPaleta(arte);
  atualizarConclusao();
  atualizarSeloBlocos();
  espelhar();
  tocar('varredura');
}

function montarPaleta(arte) {
  const caixa = $('paleta-arte');
  caixa.innerHTML = '';
  if (!arte.coresRgb.length) return;
  const rotulo = document.createElement('span');
  rotulo.className = 'legenda';
  rotulo.textContent = 'Paleta desta arte';
  caixa.appendChild(rotulo);
  for (const v of arte.coresRgb) {
    const hex = inteiroParaHex(v);
    const amostra = document.createElement('span');
    amostra.className = 'selo';
    amostra.style.gap = '6px';
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    amostra.innerHTML =
      '<span style="width:12px;height:12px;display:inline-block;background:' + hex +
      ';border:1px solid var(--linha-forte)"></span>' +
      (prefs.linguagem === 'portugol' ? 'pixel.cor(' + r + ', ' + g + ', ' + b + ')' : hex);
    amostra.title = hex + '  ·  R ' + r + '  G ' + g + '  B ' + b;
    caixa.appendChild(amostra);
  }
  if (arte.dica) {
    const dica = document.createElement('span');
    dica.className = 'texto-mini texto-suave';
    dica.style.flex = '1 1 200px';
    dica.textContent = arte.dica;
    caixa.appendChild(dica);
  }
}

/* --------------------------------------------------------- execucao */

/* Mede o tamanho do programa na linguagem em uso. As duas contagens sao
   trazidas para a mesma escala, senao o Portugol seria injustamente punido. */
function medirCodigo() {
  if (prefs.linguagem === 'portugol') {
    return { blocos: ultimaMedidaPortugol, usouRepeticao: true, pintarSolto: false, usouProcedimento: false };
  }
  return oficina.metricas();
}

let ultimaMedidaPortugol = 0;

function rodar(lento) {
  if (!sessao.emTreino || sessao.pausado) return;
  limparErro();

  const resultado = prefs.linguagem === 'portugol' ? rodarPortugol() : rodarBlocos();
  const met = medirCodigo();

  if (!resultado.ok) {
    render.redesenhar();
    atualizarConclusao();
    mostrarErro(resultado.erro);
    tocar('erro');
    if (resultado.tipo === 'limite') nova('erroLimite');
    else if (resultado.tipo === 'limite-grid') nova('erroGrid');
    else if (resultado.tipo === 'vazio') nova('vazio');
    else novaLivre(resultado.erro);
    return;
  }

  tocar('executar');
  jaExecutouNaArte = true;

  const aoFim = () => {
    atualizarSeloBlocos();
    atualizarConclusao();
    espelhar();
    comentarExecucao(met);
    if (modoAtual.comAlvo && modelo.completa()) {
      setTimeout(() => concluirArte(true), 320);
    }
  };

  if (prefs.animarDesenho || lento) {
    reprodutor.reproduzir(resultado.trilha, {
      lento,
      aoProgredir: () => atualizarConclusao(),
      aoTerminar: aoFim,
    });
  } else {
    render.redesenhar();
    aoFim();
  }
}

/* --------------------------------------------------- as duas linguagens */

function rodarBlocos() {
  const codigo = oficina.gerarCodigo();
  return executar(codigo, modelo, { limparAntes: true });
}

function rodarPortugol() {
  const fonte = $('portugol-editor').value;
  if (!fonte.trim()) {
    return { ok: false, erro: 'PROGRAMA VAZIO. Escreva o codigo antes de executar.', tipo: 'vazio' };
  }
  const anterior = modelo.pintado.slice();
  const x0 = modelo.x, y0 = modelo.y;

  const runtime = new Runtime(modelo, { limparAntes: true });
  runtime.comecar();
  const r = interpretar(fonte, runtime);
  ultimaMedidaPortugol = Math.max(1, Math.round((r.instrucoes || 0) / 1.7));

  if (!r.ok) {
    modelo.pintado.set(anterior);
    modelo.x = x0; modelo.y = y0;
    modelo.recontar();
    return { ok: false, erro: r.erro, tipo: r.tipo };
  }
  modelo.recontar();
  return { ok: true, runtime, trilha: runtime.trilha };
}

function aplicarLinguagem() {
  const portugol = prefs.linguagem === 'portugol';
  $('blockly-area').classList.toggle('oculto', portugol);
  $('portugol-area').classList.toggle('oculto', !portugol);
  $('btn-docs').classList.toggle('oculto', !portugol);
  if (!portugol) oficina.redimensionar();
}

function limparCodigo() {
  oficina.limparBlocos();
  $('portugol-editor').value = MODELO_INICIAL;
  ultimaMedidaPortugol = 0;
}

function carregarCodigo(pacote) {
  if (!pacote) return;
  if (pacote.portugol) $('portugol-editor').value = pacote.portugol;
  if (pacote.blocos) {
    oficina.limparBlocos();
    try { oficina.restaurar(pacote.blocos); } catch (e) { /* mantem vazio */ }
  }
  atualizarSeloBlocos();
}

function mostrarResposta() {
  const arte = sessao.arteAtual;
  if (!arte || !arte.solucao) return;
  const certeza = window.confirm(
    'Ao ver a resposta voce nao ganha pontos por esta arte. Quer continuar?'
  );
  if (!certeza) return;
  respostaRevelada = true;
  $('btn-resposta').disabled = true;
  carregarCodigo(arte.solucao);
  novaLivre('Solucao carregada. Leia com calma, execute e veja como as pecas se encaixam. Esta arte nao vale pontos.');
  tocar('aviso');
}

function comentarExecucao(met) {
  const arte = sessao.arteAtual;
  const pct = Math.round(modelo.percentual());
  const efic = eficienciaTransmissao(met.blocos, arte.par);

  if (modoAtual.comPontos) {
    $('disp-eficiencia').textContent = efic + '%';
    $('disp-eficiencia').className = 'leitura-valor' + (efic >= 70 ? '' : ' neutro');
  }

  if (!modoAtual.comAlvo) { novaLivre('Transmissao aplicada. ' + met.blocos + ' blocos usados.'); return; }

  if (pct >= 100 && modelo.erros > 0) {
    novaLivre('Cobertura completa, mas ha ' + modelo.erros +
      ' pixel(s) pintados fora do lugar. Apague eles para fechar a transmissao.');
    return;
  }
  if (modelo.erros > 0) { nova('comErro', { e: modelo.erros }); return; }
  if (modelo.completa()) return;                // a fala de conclusao vem depois
  if (met.blocos > arte.par * 2.5) { nova('muitosBlocos', { n: met.blocos, par: arte.par }); return; }
  if (efic >= 80) { nova('eficiente', { n: met.blocos }); return; }
  if (pct < 30) nova('progressoBaixo', { p: pct });
  else if (pct < 75) nova('progressoMedio', { p: pct });
  else nova('progressoAlto', { p: pct });
}

function atualizarConclusao() {
  const pct = modelo.percentual();
  $('pct-valor').textContent = Math.round(pct) + '%';
  const barra = $('medidor-conclusao');
  barra.style.width = Math.min(100, pct) + '%';
  barra.className = 'medidor-barra' + (pct >= 75 ? '' : pct >= 30 ? ' aviso' : ' critico');
  $('selo-cursor').textContent = 'x ' + modelo.x + '  y ' + modelo.y;

  const selErros = $('selo-erros');
  selErros.classList.toggle('oculto', modelo.erros === 0);
  selErros.textContent = modelo.erros + (modelo.erros === 1 ? ' erro' : ' erros');

  if (modoAtual.podePassar) $('btn-passar').disabled = pct < 75;
}

function atualizarSeloBlocos() {
  if (!oficinaPronta) return;
  const portugol = prefs.linguagem === 'portugol';
  const met = medirCodigo();
  const par = sessao.arteAtual ? sessao.arteAtual.par : 0;
  const unidade = portugol ? ' instrucoes' : ' blocos';
  $('selo-blocos').textContent = met.blocos + unidade + (par ? '  /  ideal ' + par : '');
  $('selo-blocos').className = 'selo' + (par && met.blocos && met.blocos <= par ? ' selo-verde' : '');
}

/* ----------------------------------------------------- conclusao */

function concluirArte(completa) {
  if (!sessao.emTreino || !sessao.arteAtual) return;
  const arte = sessao.arteAtual;
  const met = oficina.metricas();
  const segundos = Math.max(1, Math.round((performance.now() - sessao.inicioArte) / 1000));
  const pct = modelo.percentual();

  const nota = respostaRevelada
    ? { total: 0, eficiencia: 0 }
    : calcularPontos({
    tamanho: arte.largura,
    percentual: pct,
    completa,
    segundos,
    tamanhoCodigo: met.blocos,
    par: arte.par,
    erros: modelo.erros,
  });

  sessao.pontos += nota.total;
  if (completa) sessao.artesFeitas++; else sessao.artesPassadas++;
  sessao.historico.push({
    nome: arte.nome,
    percentual: pct,
    pontos: nota.total,
    segundos,
    blocos: met.blocos,
    par: arte.par,
    eficiencia: nota.eficiencia,
  });

  progresso.pontosTotais += nota.total;
  if (completa) progresso.artesCompletas++;
  const melhor = progresso.melhorPorNivel[arte.largura] || 0;
  progresso.melhorPorNivel[arte.largura] = Math.max(melhor, sessao.pontos);

  const ganhas = avaliarInsignias({
    completa,
    erros: modelo.erros,
    segundos,
    usouRepeticao: met.usouRepeticao,
    pintarSolto: met.pintarSolto,
    eficiencia: nota.eficiencia,
    artesFeitas: sessao.artesFeitas,
  });
  for (const id of ganhas) {
    if (!sessao.insigniasNovas.includes(id)) sessao.insigniasNovas.push(id);
    if (!progresso.insignias.includes(id)) progresso.insignias.push(id);
  }

  let glifoTexto = '';
  if (completa) {
    const g = sortearGlifoNovo(progresso.glifos);
    if (g !== null) {
      progresso.glifos.push(g);
      sessao.glifosNovos.push(g);
      glifoTexto = SIGNIFICADOS[g];
    }
  }

  salvarProgresso();
  $('disp-pontos').textContent = String(sessao.pontos);
  atualizarPatente();

  if (completa) {
    tocar('completo');
    nova('completo');
    if (glifoTexto) setTimeout(() => { tocar('glifo'); nova('glifo', { g: glifoTexto }); }, 900);
  } else {
    tocar('acerto');
    nova('passou', { p: Math.round(pct) });
  }

  setTimeout(() => { if (sessao.emTreino) proximaArte(); }, completa ? 1500 : 700);
}

function passarArte() {
  if (modelo.percentual() < 75) return;
  concluirArte(false);
}

function alternarPausa() {
  sessao.pausado = !sessao.pausado;
  if (sessao.pausado) cronometro.pausar(); else cronometro.retomar();
  $('btn-pausar').innerHTML = icone(sessao.pausado ? 'retomar' : 'pausar', 16);
  $('btn-pausar').title = sessao.pausado ? 'Retomar' : 'Pausar';
  $('btn-rodar').disabled = sessao.pausado;
  novaLivre(sessao.pausado
    ? 'Treino em pausa. O cronometro parou junto.'
    : 'Treino retomado.');
  tocar('clique');
}

/* -------------------------------------------------------- encerramento */

function pararTreino(opcoes = {}) {
  if (!sessao.emTreino) return;
  sessao.emTreino = false;
  cronometro.parar();
  if (reprodutor) reprodutor.cancelar();

  if (!modoAtual.comPontos) { voltarParaConfiguracao(); return; }

  if (opcoes.porTempo) {
    // Aviso claro antes do relatorio, para ninguem ser pego de surpresa.
    $('texto-tempo').textContent =
      'O cronometro da missao chegou ao fim. Voce fez ' + sessao.pontos +
      ' ponto(s) em ' + (sessao.artesFeitas + sessao.artesPassadas) + ' arte(s).';
    abrirModal('modal-tempo');
    return;
  }

  montarRelatorio();
  abrirModal('modal-relatorio');
  tocar('fim');
}

function voltarParaConfiguracao() {
  sessao.emTreino = false;
  cronometro.parar();
  $('tela-treino').classList.add('oculto');
  $('tela-config').classList.remove('oculto');
  $('disp-tempo').textContent = '--:--';
  atualizarResumoCatalogo();
}

function dadosRelatorio() {
  const efics = sessao.historico.map((h) => h.eficiencia).filter((n) => n > 0);
  const media = efics.length ? Math.round(efics.reduce((a, b) => a + b, 0) / efics.length) : 0;
  return {
    aluno: $('inp-aluno').value.trim(),
    pontos: sessao.pontos,
    pontosTotais: progresso.pontosTotais,
    artesFeitas: sessao.artesFeitas,
    artesPassadas: sessao.artesPassadas,
    eficienciaMedia: media,
    modo: modoAtual.rotulo,
    tamanho: prefs.tamanho,
    foco: modoAtual.usaFoco ? prefs.foco : 'livre',
    duracao: prefs.tempoInfinito ? 'sem limite' : prefs.minutos + ' min',
    historico: sessao.historico,
    insignias: sessao.insigniasNovas,
    glifos: sessao.glifosNovos,
    data: new Date().toLocaleDateString('pt-BR'),
  };
}

function montarRelatorio() {
  const d = dadosRelatorio();
  const corpo = $('corpo-relatorio');
  const linhas = sessao.historico.map((h) =>
    '<tr><td style="padding:3px 8px 3px 0">' + h.nome + '</td>' +
    '<td style="padding:3px 8px;color:' + (h.percentual >= 100 ? 'var(--verde)' : 'var(--texto-suave)') + '">' +
    Math.round(h.percentual) + '%</td>' +
    '<td style="padding:3px 8px">' + h.segundos + 's</td>' +
    '<td style="padding:3px 8px">' + h.blocos + ' / ' + h.par + '</td>' +
    '<td style="padding:3px 0;text-align:right">' + h.pontos + '</td></tr>'
  ).join('');

  const insignias = sessao.insigniasNovas
    .map((id) => (INSIGNIAS.find((x) => x.id === id) || {}))
    .filter((x) => x.nome)
    .map((x) => '<span class="selo selo-ciano">' + x.nome + '</span>')
    .join(' ');

  const glifos = sessao.glifosNovos
    .map((g) => '<span class="selo selo-verde" style="gap:6px">' + glifoSvg(g, 16) + SIGNIFICADOS[g] + '</span>')
    .join(' ');

  corpo.innerHTML =
    '<div class="fileira" style="gap:24px">' +
      caixaNumero('Pontuacao', d.pontos) +
      caixaNumero('Artes 100%', d.artesFeitas) +
      caixaNumero('Artes passadas', d.artesPassadas) +
      caixaNumero('Eficiencia media', d.eficienciaMedia + '%') +
      caixaNumero('Patente', patenteDe(progresso.pontosTotais).nome) +
    '</div>' +
    '<hr class="divisor">' +
    '<div class="legenda">Registro de transmissoes</div>' +
    (linhas
      ? '<table class="texto-peq" style="width:100%;border-collapse:collapse">' + linhas + '</table>'
      : '<p class="texto-peq texto-suave">Nenhuma arte concluida neste treino.</p>') +
    (insignias ? '<hr class="divisor"><div class="legenda">Insignias</div><div class="fileira">' + insignias + '</div>' : '') +
    (glifos ? '<hr class="divisor"><div class="legenda">Glifos decodificados</div><div class="fileira">' + glifos + '</div>' : '');
}

function caixaNumero(rotulo, valor) {
  return '<div><div class="legenda">' + rotulo + '</div>' +
    '<div class="display display-medio">' + valor + '</div></div>';
}

function exportarRelatorio() {
  const d = dadosRelatorio();
  if (!d.aluno) {
    $('inp-aluno').focus();
    $('inp-aluno').style.borderColor = 'var(--vermelho)';
    return;
  }
  $('inp-aluno').style.borderColor = '';
  baixarCartao(d);
  tocar('acerto');
}

/* ------------------------------------------------------------ extras */

function baixarDesenho() {
  const link = document.createElement('a');
  link.download = 'pixelart-' + Date.now() + '.png';
  link.href = render.paraPng(12);
  link.click();
  tocar('acerto');
}

function espelhar() {
  const cv = $('cv-espelho');
  if (!cv || !modelo) return;
  cv.width = modelo.largura;
  cv.height = modelo.altura;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage($('grid-palco').querySelector('[data-camada="alvo"]'), 0, 0);
  ctx.drawImage($('grid-palco').querySelector('[data-camada="pintado"]'), 0, 0);
}

function mostrarErro(texto) {
  const faixa = $('faixa-erro');
  faixa.textContent = texto;
  faixa.classList.remove('oculto');
}

function limparErro() {
  $('faixa-erro').classList.add('oculto');
  $('faixa-erro').textContent = '';
}

function prepararDivisor() {
  const tela = $('tela-treino');
  const divisor = $('divisor-paineis');
  const aplicar = (pct) => {
    const v = Math.max(25, Math.min(75, pct));
    tela.style.setProperty('--col-codigo', v + 'fr');
    tela.style.setProperty('--col-grid', (100 - v) + 'fr');
    prefs.divisao = Math.round(v);
  };
  aplicar(prefs.divisao);

  let arrastando = false;
  const mover = (clientX) => {
    const caixa = tela.getBoundingClientRect();
    aplicar(((clientX - caixa.left) / caixa.width) * 100);
    oficina.redimensionar();
    if (render) { render.ajustarTamanho(); render.redesenhar(); }
  };

  divisor.addEventListener('pointerdown', (ev) => {
    arrastando = true;
    divisor.setPointerCapture(ev.pointerId);
  });
  divisor.addEventListener('pointermove', (ev) => { if (arrastando) mover(ev.clientX); });
  divisor.addEventListener('pointerup', (ev) => {
    arrastando = false;
    divisor.releasePointerCapture(ev.pointerId);
    salvarPrefs();
  });
  divisor.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft') { aplicar(prefs.divisao - 3); oficina.redimensionar(); }
    if (ev.key === 'ArrowRight') { aplicar(prefs.divisao + 3); oficina.redimensionar(); }
  });
}

/* --------------------------------------------------- service worker */

function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').catch(() => {
    // Sem service worker o site continua funcionando, so nao instala offline.
  });
}
