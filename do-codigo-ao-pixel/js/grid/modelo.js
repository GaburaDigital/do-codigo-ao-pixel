/* =========================================================================
   modelo.js — Estado do grid: o que e alvo, o que foi pintado e o cursor.
   ========================================================================= */

export class ModeloGrid {
  constructor(arte) {
    this.trocarArte(arte);
  }

  trocarArte(arte) {
    this.arte = arte;
    // Uma arte sem nenhum pixel alvo e uma tela livre: nada a corrigir.
    this.verificar = arte.pintados > 0;
    this.largura = arte.largura;
    this.altura = arte.altura;
    this.pintado = new Int32Array(this.largura * this.altura).fill(-1);
    this.x = 0;
    this.y = 0;
    this.acertos = 0;
    this.erros = 0;
  }

  limparPintura() {
    this.pintado.fill(-1);
    this.x = 0;
    this.y = 0;
    this.acertos = 0;
    this.erros = 0;
  }

  dentro(x, y) {
    return x >= 0 && y >= 0 && x < this.largura && y < this.altura;
  }

  indice(x, y) {
    return y * this.largura + x;
  }

  pintar(x, y, valorRgb) {
    if (!this.dentro(x, y)) return;
    this.pintado[this.indice(x, y)] = valorRgb;
  }

  corEm(x, y) {
    if (!this.dentro(x, y)) return -1;
    return this.pintado[this.indice(x, y)];
  }

  /* Recalcula acertos e erros comparando com a arte alvo. */
  recontar() {
    if (!this.verificar) {
      this.acertos = 0;
      this.erros = 0;
      return { acertos: 0, erros: 0 };
    }
    const { alvo } = this.arte;
    let acertos = 0, erros = 0;
    for (let i = 0; i < this.pintado.length; i++) {
      const p = this.pintado[i];
      if (p === -1) continue;
      if (p === alvo[i]) acertos++;
      else erros++;
    }
    this.acertos = acertos;
    this.erros = erros;
    return { acertos, erros };
  }

  /* So conta como concluida quando cobre a arte inteira e nao sobra
     nenhum pixel pintado fora do lugar. Sem isso daria para "completar"
     uma arte de cor unica pintando o grid todo. */
  completa() {
    return this.verificar && this.erros === 0 && this.acertos >= this.arte.pintados;
  }

  percentual() {
    const alvoPintados = this.arte.pintados;
    if (!alvoPintados) return 0;
    return Math.min(100, (this.acertos / alvoPintados) * 100);
  }

  /* Um pixel foi pintado com cor diferente da esperada. */
  ehErro(i) {
    if (!this.verificar) return false;
    const p = this.pintado[i];
    return p !== -1 && p !== this.arte.alvo[i];
  }
}
