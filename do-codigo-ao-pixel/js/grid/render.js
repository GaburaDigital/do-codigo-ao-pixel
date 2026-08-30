/* =========================================================================
   render.js — Desenha o grid em tres camadas:
     1. alvo     (a arte de referencia, com transparencia)
     2. pintado  (o que o codigo do aluno pintou)
     3. sobre    (linhas do grid, marcacao de erro e cursor)
   ========================================================================= */

const OPACIDADE_ALVO = 0.34;

export class RenderGrid {
  constructor(palco) {
    this.palco = palco;
    this.cvAlvo = palco.querySelector('[data-camada="alvo"]');
    this.cvPintado = palco.querySelector('[data-camada="pintado"]');
    this.cvSobre = palco.querySelector('[data-camada="sobre"]');
    this.ctxAlvo = this.cvAlvo.getContext('2d');
    this.ctxPintado = this.cvPintado.getContext('2d');
    this.ctxSobre = this.cvSobre.getContext('2d');
    this.modelo = null;
    this.mostrarAlvo = true;
    this.marcarErros = true;
    this.ladoTela = 512;
  }

  ligar(modelo) {
    this.modelo = modelo;
    const { largura, altura } = modelo;
    for (const cv of [this.cvAlvo, this.cvPintado]) {
      cv.width = largura;
      cv.height = altura;
    }
    this.ajustarTamanho();
    this.desenharAlvo();
    this.desenharPintado();
    this.desenharSobre();
  }

  /* Mantem o palco quadrado e alinhado ao espaco disponivel. */
  ajustarTamanho() {
    if (!this.modelo) return;
    const pai = this.palco.parentElement;
    const estilo = getComputedStyle(pai);
    const recuoX = parseFloat(estilo.paddingLeft) + parseFloat(estilo.paddingRight);
    const recuoY = parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom);
    const disponivel = Math.max(
      120,
      Math.min(pai.clientWidth - recuoX - 8, pai.clientHeight - recuoY - 8)
    );
    // Trava em multiplos do numero de pixels para o grid ficar nitido.
    const cel = Math.max(2, Math.floor(disponivel / this.modelo.largura));
    const lado = cel * this.modelo.largura;
    this.ladoTela = lado;
    this.palco.style.width = lado + 'px';
    this.palco.style.height = lado + 'px';

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cvSobre.width = Math.round(lado * dpr);
    this.cvSobre.height = Math.round(lado * dpr);
    this.ctxSobre.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  desenharAlvo() {
    if (!this.modelo) return;
    const { largura, altura, arte } = this.modelo;
    const img = this.ctxAlvo.createImageData(largura, altura);
    const d = img.data;
    for (let i = 0; i < arte.alvo.length; i++) {
      const v = arte.alvo[i];
      const p = i * 4;
      if (v === -1 || !this.mostrarAlvo) { d[p + 3] = 0; continue; }
      d[p] = (v >> 16) & 255;
      d[p + 1] = (v >> 8) & 255;
      d[p + 2] = v & 255;
      d[p + 3] = Math.round(255 * OPACIDADE_ALVO);
    }
    this.ctxAlvo.putImageData(img, 0, 0);
  }

  desenharPintado() {
    if (!this.modelo) return;
    const { largura, altura, pintado } = this.modelo;
    const img = this.ctxPintado.createImageData(largura, altura);
    const d = img.data;
    for (let i = 0; i < pintado.length; i++) {
      const v = pintado[i];
      const p = i * 4;
      if (v === -1) { d[p + 3] = 0; continue; }
      d[p] = (v >> 16) & 255;
      d[p + 1] = (v >> 8) & 255;
      d[p + 2] = v & 255;
      d[p + 3] = 255;
    }
    this.ctxPintado.putImageData(img, 0, 0);
  }

  desenharSobre() {
    if (!this.modelo) return;
    const ctx = this.ctxSobre;
    const lado = this.ladoTela;
    const n = this.modelo.largura;
    const cel = lado / n;
    ctx.clearRect(0, 0, lado, lado);

    const estilo = getComputedStyle(document.documentElement);
    const corGrade = estilo.getPropertyValue('--grade').trim() || 'rgba(255,255,255,0.15)';
    const corGradeForte = estilo.getPropertyValue('--grade-forte').trim() || 'rgba(255,255,255,0.3)';
    const corErro = estilo.getPropertyValue('--marca-erro').trim() || '#000';
    const corCursor = estilo.getPropertyValue('--verde').trim() || '#3BFF9E';

    // Linhas finas de cada pixel (some quando ficam apertadas demais).
    if (cel >= 5) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = corGrade;
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const p = Math.round(i * cel) + 0.5;
        ctx.moveTo(p, 0); ctx.lineTo(p, lado);
        ctx.moveTo(0, p); ctx.lineTo(lado, p);
      }
      ctx.stroke();
    }

    // Linhas de referencia a cada 8 pixels, para o aluno se localizar.
    ctx.lineWidth = 1;
    ctx.strokeStyle = corGradeForte;
    ctx.beginPath();
    for (let i = 8; i < n; i += 8) {
      const p = Math.round(i * cel) + 0.5;
      ctx.moveTo(p, 0); ctx.lineTo(p, lado);
      ctx.moveTo(0, p); ctx.lineTo(lado, p);
    }
    ctx.stroke();

    // X preto no centro dos pixels com a cor errada.
    // No Desenho Livre nao existe gabarito, entao nada e marcado como erro.
    const m = this.modelo;
    if (this.marcarErros) {
    ctx.strokeStyle = corErro;
    ctx.lineWidth = Math.max(1, cel * 0.14);
    ctx.beginPath();
    const margem = cel * 0.28;
    for (let i = 0; i < m.pintado.length; i++) {
      if (!m.ehErro(i)) continue;
      const x = (i % n) * cel;
      const y = Math.floor(i / n) * cel;
      ctx.moveTo(x + margem, y + margem);
      ctx.lineTo(x + cel - margem, y + cel - margem);
      ctx.moveTo(x + cel - margem, y + margem);
      ctx.lineTo(x + margem, y + cel - margem);
    }
    ctx.stroke();
    }

    // Cursor: contorno quadrado na posicao atual.
    const cx = m.x * cel;
    const cy = m.y * cel;
    ctx.lineWidth = Math.max(1.5, cel * 0.16);
    ctx.strokeStyle = corCursor;
    ctx.strokeRect(cx + ctx.lineWidth / 2, cy + ctx.lineWidth / 2,
      cel - ctx.lineWidth, cel - ctx.lineWidth);
    // Farpas nos cantos, para o cursor aparecer mesmo em grid grande.
    const f = Math.max(3, cel * 0.9);
    ctx.beginPath();
    ctx.moveTo(cx - f, cy + cel / 2); ctx.lineTo(cx - 2, cy + cel / 2);
    ctx.moveTo(cx + cel + 2, cy + cel / 2); ctx.lineTo(cx + cel + f, cy + cel / 2);
    ctx.moveTo(cx + cel / 2, cy - f); ctx.lineTo(cx + cel / 2, cy - 2);
    ctx.moveTo(cx + cel / 2, cy + cel + 2); ctx.lineTo(cx + cel / 2, cy + cel + f);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  redesenhar() {
    this.desenharPintado();
    this.desenharSobre();
  }

  alternarAlvo(mostrar) {
    this.mostrarAlvo = mostrar;
    this.desenharAlvo();
  }

  /* Exporta o desenho do aluno como PNG (usado no Desenho Livre). */
  paraPng(escala = 8) {
    const m = this.modelo;
    const cv = document.createElement('canvas');
    cv.width = m.largura * escala;
    cv.height = m.altura * escala;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.cvPintado, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/png');
  }
}
