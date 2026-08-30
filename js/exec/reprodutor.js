/* =========================================================================
   reprodutor.js — Anima a trilha de execucao sobre o grid.

   O programa do aluno roda de uma vez so (instantaneo). Depois a pintura e
   reproduzida em cerca de 0,8 s, para dar a sensacao de a nave desenhar.
   O modo lento serve para depurar: da para ver o cursor andando.
   ========================================================================= */

const DURACAO_RAPIDA = 800;
const DURACAO_LENTA = 6000;

export class Reprodutor {
  constructor(modelo, render) {
    this.m = modelo;
    this.render = render;
    this.quadro = null;
    this.rodando = false;
    this.aoTerminar = null;
  }

  cancelar() {
    if (this.quadro) cancelAnimationFrame(this.quadro);
    this.quadro = null;
    this.rodando = false;
  }

  /* Aplica toda a trilha instantaneamente (sem animacao). */
  aplicarTudo(trilha) {
    for (const op of trilha) {
      if (op.t === 'p') this.m.pintar(op.x, op.y, op.c);
      else if (op.t === 'a') this.m.pintar(op.x, op.y, -1);
      else { this.m.x = op.x; this.m.y = op.y; }
    }
    this.m.recontar();
    this.render.redesenhar();
  }

  reproduzir(trilha, { lento = false, aoTerminar = null, aoProgredir = null } = {}) {
    this.cancelar();
    this.aoTerminar = aoTerminar;
    if (!trilha.length) {
      this.m.recontar();
      this.render.redesenhar();
      if (aoTerminar) aoTerminar();
      return;
    }

    // O estado final ja esta no modelo. Reconstruimos do zero para animar.
    const finalPintado = this.m.pintado.slice();
    const finalX = this.m.x, finalY = this.m.y;
    this.m.limparPintura();
    this.render.redesenhar();

    const duracao = lento ? DURACAO_LENTA : DURACAO_RAPIDA;
    const total = trilha.length;
    const inicio = performance.now();
    this.rodando = true;
    let cursor = 0;

    const passoAnimacao = (agora) => {
      if (!this.rodando) return;
      const t = Math.min(1, (agora - inicio) / duracao);
      const alvoIndice = Math.floor(t * total);
      while (cursor < alvoIndice) {
        const op = trilha[cursor++];
        if (op.t === 'p') this.m.pintar(op.x, op.y, op.c);
        else if (op.t === 'a') this.m.pintar(op.x, op.y, -1);
        else { this.m.x = op.x; this.m.y = op.y; }
      }
      this.m.recontar();
      this.render.redesenhar();
      if (aoProgredir) aoProgredir(this.m.percentual());

      if (t < 1) {
        this.quadro = requestAnimationFrame(passoAnimacao);
      } else {
        this.m.pintado.set(finalPintado);
        this.m.x = finalX; this.m.y = finalY;
        this.m.recontar();
        this.render.redesenhar();
        this.rodando = false;
        this.quadro = null;
        if (aoProgredir) aoProgredir(this.m.percentual());
        if (this.aoTerminar) this.aoTerminar();
      }
    };
    this.quadro = requestAnimationFrame(passoAnimacao);
  }
}
