/* =========================================================================
   cronometro.js — Contagem regressiva do treino, com pausa e modo infinito.
   ========================================================================= */

export class Cronometro {
  constructor({ aoAtualizar, aoTerminar }) {
    this.aoAtualizar = aoAtualizar || (() => {});
    this.aoTerminar = aoTerminar || (() => {});
    this.total = 0;
    this.restante = 0;
    this.decorrido = 0;
    this.infinito = false;
    this.rodando = false;
    this.timer = null;
    this.ultimoTique = 0;
  }

  iniciar(segundos, infinito = false) {
    this.parar();
    this.total = segundos;
    this.restante = segundos;
    this.decorrido = 0;
    this.infinito = infinito;
    this.rodando = true;
    this.ultimoTique = performance.now();
    this.timer = setInterval(() => this.tique(), 250);
    this.aoAtualizar(this.leitura());
  }

  tique() {
    if (!this.rodando) return;
    const agora = performance.now();
    const delta = (agora - this.ultimoTique) / 1000;
    this.ultimoTique = agora;
    this.decorrido += delta;
    if (!this.infinito) {
      this.restante = Math.max(0, this.restante - delta);
      if (this.restante <= 0) {
        this.parar();
        this.aoAtualizar(this.leitura());
        this.aoTerminar();
        return;
      }
    }
    this.aoAtualizar(this.leitura());
  }

  pausar() {
    if (!this.rodando) return;
    this.rodando = false;
    clearInterval(this.timer);
    this.timer = null;
  }

  retomar() {
    if (this.rodando || (!this.infinito && this.restante <= 0)) return;
    this.rodando = true;
    this.ultimoTique = performance.now();
    this.timer = setInterval(() => this.tique(), 250);
  }

  reiniciar() {
    this.iniciar(this.total, this.infinito);
  }

  parar() {
    this.rodando = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  leitura() {
    const s = this.infinito ? this.decorrido : this.restante;
    const inteiros = Math.floor(s);
    const min = String(Math.floor(inteiros / 60)).padStart(2, '0');
    const seg = String(inteiros % 60).padStart(2, '0');
    return {
      texto: (this.infinito ? '' : '') + min + ':' + seg,
      restante: this.restante,
      decorrido: this.decorrido,
      fracao: this.infinito || !this.total ? 1 : this.restante / this.total,
      infinito: this.infinito,
      rodando: this.rodando,
    };
  }
}
