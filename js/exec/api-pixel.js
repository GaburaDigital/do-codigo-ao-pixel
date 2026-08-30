/* =========================================================================
   api-pixel.js — A biblioteca "pixel": tudo o que o codigo do aluno pode
   fazer com o cursor e com o grid.

   A mesma API atende os blocos e (na fase 2) o Portugol, para que os dois
   modos se comportem exatamente igual.
   ========================================================================= */

export const MAX_PASSOS = 300000;
export const MAX_MS = 2000;

export const TRANSPARENTE = [-1, -1, -1];

export class ErroExecucao extends Error {
  constructor(mensagem, tipo = 'execucao') {
    super(mensagem);
    this.nome = 'ErroExecucao';
    this.tipo = tipo;
  }
}

export class Runtime {
  constructor(modelo, opcoes = {}) {
    this.m = modelo;
    this.maxPassos = opcoes.maxPassos || MAX_PASSOS;
    this.maxMs = opcoes.maxMs || MAX_MS;
    this.passos = 0;
    this.inicio = 0;
    this.trilha = [];       // sequencia de operacoes, usada na animacao
    this.pinturas = 0;
    this.limparAntes = opcoes.limparAntes !== false;
  }

  comecar() {
    this.passos = 0;
    this.pinturas = 0;
    this.trilha = [];
    this.inicio = performance.now();
    if (this.limparAntes) this.m.limparPintura();
    this.trilha.push({ t: 'ir', x: this.m.x, y: this.m.y });
  }

  /* Chamado a cada iteracao pelo codigo gerado. Segura loops infinitos. */
  passo() {
    if (++this.passos > this.maxPassos) {
      throw new ErroExecucao(
        'LOOP INFINITO DETECTADO. O programa passou de ' +
        this.maxPassos.toLocaleString('pt-BR') + ' comandos. Reveja suas repeticoes.',
        'limite'
      );
    }
    if ((this.passos & 1023) === 0 && performance.now() - this.inicio > this.maxMs) {
      throw new ErroExecucao(
        'TEMPO DE PROCESSAMENTO ESGOTADO. O programa demorou demais para terminar.',
        'limite'
      );
    }
  }

  /* --------------------------------------------------------- movimento */

  _validar(x, y) {
    if (!this.m.dentro(x, y)) {
      throw new ErroExecucao(
        'CURSOR FORA DO GRID. Tentou ir para (' + x + ', ' + y + '), mas o grid vai de ' +
        '(0, 0) ate (' + (this.m.largura - 1) + ', ' + (this.m.altura - 1) + ').',
        'limite-grid'
      );
    }
  }

  moverX(d) {
    this.passo();
    const nx = this.m.x + Math.trunc(Number(d) || 0);
    this._validar(nx, this.m.y);
    this.m.x = nx;
    this.trilha.push({ t: 'ir', x: this.m.x, y: this.m.y });
  }

  moverY(d) {
    this.passo();
    const ny = this.m.y + Math.trunc(Number(d) || 0);
    this._validar(this.m.x, ny);
    this.m.y = ny;
    this.trilha.push({ t: 'ir', x: this.m.x, y: this.m.y });
  }

  irPara(x, y) {
    this.passo();
    const nx = Math.trunc(Number(x) || 0);
    const ny = Math.trunc(Number(y) || 0);
    this._validar(nx, ny);
    this.m.x = nx; this.m.y = ny;
    this.trilha.push({ t: 'ir', x: nx, y: ny });
  }

  irParaX(x) { this.irPara(x, this.m.y); }
  irParaY(y) { this.irPara(this.m.x, y); }

  posicaoX() { return this.m.x; }
  posicaoY() { return this.m.y; }

  largura() { return this.m.largura; }
  altura() { return this.m.altura; }

  /* ------------------------------------------------------------- cores */

  static normalizarCor(cor) {
    if (Array.isArray(cor)) {
      const [r, g, b] = cor;
      if (r === -1) return -1;
      return ((Number(r) & 255) << 16) | ((Number(g) & 255) << 8) | (Number(b) & 255);
    }
    if (typeof cor === 'string' && cor.startsWith('#')) {
      return parseInt(cor.slice(1), 16);
    }
    if (typeof cor === 'number') return cor;
    return -1;
  }

  pintar(cor) {
    this.passo();
    const valor = Runtime.normalizarCor(cor);
    if (valor === -1) {
      throw new ErroExecucao('COR INVALIDA no comando pintar. Use um bloco de cor.', 'valor');
    }
    this.m.pintar(this.m.x, this.m.y, valor);
    this.pinturas++;
    this.trilha.push({ t: 'p', x: this.m.x, y: this.m.y, c: valor });
  }

  apagar() {
    this.passo();
    this.m.pintar(this.m.x, this.m.y, -1);
    this.trilha.push({ t: 'a', x: this.m.x, y: this.m.y });
  }

  pegarCor(x, y) {
    this.passo();
    const px = x === undefined ? this.m.x : Math.trunc(Number(x) || 0);
    const py = y === undefined ? this.m.y : Math.trunc(Number(y) || 0);
    const v = this.m.corEm(px, py);
    if (v === -1) return TRANSPARENTE.slice();
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  /* Cor da arte de referencia naquela posicao. */
  pegarCorAlvo(x, y) {
    this.passo();
    const px = x === undefined ? this.m.x : Math.trunc(Number(x) || 0);
    const py = y === undefined ? this.m.y : Math.trunc(Number(y) || 0);
    if (!this.m.dentro(px, py)) return TRANSPARENTE.slice();
    const v = this.m.arte.alvo[this.m.indice(px, py)];
    if (v === -1) return TRANSPARENTE.slice();
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  corRgb(r, g, b) {
    return [
      Math.max(0, Math.min(255, Math.trunc(Number(r) || 0))),
      Math.max(0, Math.min(255, Math.trunc(Number(g) || 0))),
      Math.max(0, Math.min(255, Math.trunc(Number(b) || 0))),
    ];
  }

  componente(cor, qual) {
    const c = Array.isArray(cor) ? cor : [0, 0, 0];
    if (qual === 'VERMELHO') return c[0];
    if (qual === 'VERDE') return c[1];
    return c[2];
  }

  corIgual(a, b) {
    return Runtime.normalizarCor(a) === Runtime.normalizarCor(b);
  }

  ehTransparente(cor) {
    return Runtime.normalizarCor(cor) === -1;
  }
}
