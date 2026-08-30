/* =========================================================================
   app.js — Controlador principal. Amarra configuracao, treino, execucao,
   pontuacao e relatorio.
   ========================================================================= */

import {
  prefs, salvarPrefs, aplicarTema, progresso, salvarProgresso,
  sessao, zerarSessao,
} from './nucleo/estado.js';
import { carregarCatalogo, sortearArte, arteVazia, listarArtes, inteiroParaHex } from './nucleo/catalogo.js';
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

const $ = (id) => document.getElementById(id);

let modelo = null;
let render = null;
let reprodutor = null;
let cronometro = null;
let oficinaPronta = false;
let modoAtual = descritorModo(prefs.modo);
let observadorTamanho = null;
let jaExecutouNaArte = false;

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
  const total = [32, 64, 128].reduce((s, t) => s + listarArtes(t, 'geral').length, 0);
  $('resumo-catalogo').textContent = total + ' artes disponiveis no catalogo.';
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

  $('btn-iniciar').addEventListener('click', () => { despertarAudio(); iniciarTreino(); });
  refletirModoNaConfig();
}

function refletirModoNaConfig() {
  $('grupo-foco').style.display = modoAtual.usaFoco ? '' : 'none';
  $('grupo-tempo').style.display = modoAtual.comCronometro ? '' : 'none';
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
    aoTerminar: () => { tocar('fim'); pararTreino(); },
  });

  $('btn-rodar').addEventListener('click', () => rodar(false));
  $('btn-lento').addEventListener('click', () => rodar(true));
  $('btn-limpar-codigo').addEventListener('click', () => {
    oficina.limparBlocos();
    atualizarSeloBlocos();
    tocar('clique');
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
  oficina.limparBlocos();

  let arte;
  if (modoAtual.comAlvo) {
    try {
      arte = await sortearArte(prefs.tamanho, modoAtual.usaFoco ? prefs.foco : 'geral');
    } catch (e) {
      mostrarErro('Nao consegui carregar a arte: ' + e.message);
      return;
    }
  } else {
    arte = arteVazia(prefs.tamanho);
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
    amostra.innerHTML =
      '<span style="width:12px;height:12px;display:inline-block;background:' + hex +
      ';border:1px solid var(--linha-forte)"></span>' + hex;
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

function rodar(lento) {
  if (!sessao.emTreino || sessao.pausado) return;
  limparErro();

  const codigo = oficina.gerarCodigo();
  const met = oficina.metricas();

  const resultado = executar(codigo, modelo, { limparAntes: true });

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
    atualizarConclusao();
    espelhar();
    comentarExecucao(met);
    if (modoAtual.comAlvo && modelo.percentual() >= 100) {
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

function comentarExecucao(met) {
  const arte = sessao.arteAtual;
  const pct = Math.round(modelo.percentual());
  const efic = eficienciaTransmissao(met.blocos, arte.par);

  if (modoAtual.comPontos) {
    $('disp-eficiencia').textContent = efic + '%';
    $('disp-eficiencia').className = 'leitura-valor' + (efic >= 70 ? '' : ' neutro');
  }

  if (!modoAtual.comAlvo) { novaLivre('Transmissao aplicada. ' + met.blocos + ' blocos usados.'); return; }

  if (modelo.erros > 0 && pct < 100) { nova('comErro', { e: modelo.erros }); return; }
  if (pct >= 100) return;                       // a fala de conclusao vem depois
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
  const met = oficina.metricas();
  const par = sessao.arteAtual ? sessao.arteAtual.par : 0;
  $('selo-blocos').textContent = met.blocos + ' blocos' + (par ? '  /  ideal ' + par : '');
  $('selo-blocos').className = 'selo' + (par && met.blocos <= par ? ' selo-verde' : '');
}

/* ----------------------------------------------------- conclusao */

function concluirArte(completa) {
  const arte = sessao.arteAtual;
  const met = oficina.metricas();
  const segundos = Math.max(1, Math.round((performance.now() - sessao.inicioArte) / 1000));
  const pct = modelo.percentual();

  const nota = calcularPontos({
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

function pararTreino() {
  if (!sessao.emTreino) return;
  sessao.emTreino = false;
  cronometro.parar();
  if (reprodutor) reprodutor.cancelar();

  if (!modoAtual.comPontos) { voltarParaConfiguracao(); return; }
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
