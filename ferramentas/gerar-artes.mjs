/*
  gerar-artes.mjs — Gerador procedural de artes em pixel art.

  Uso:
    node ferramentas/gerar-artes.mjs                 (padrao: 50 artes por categoria e nivel)
    node ferramentas/gerar-artes.mjs --por-categoria 60
    node ferramentas/gerar-artes.mjs --niveis 32,64
    node ferramentas/gerar-artes.mjs --limpar        (apaga as artes antigas antes)

  Cada arte e um JSON com paleta indexada e pixels em RLE.
  O indice 0 da paleta e SEMPRE o transparente.
*/

import { writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ATIVIDADES = join(RAIZ, 'ATIVIDADES');

/* ---------------------------------------------------------------- aleatorio */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashTexto(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ------------------------------------------------------------------ paletas */

const CORES = {
  verde: '#3BFF9E', ciano: '#4DE1FF', branco: '#F0F2F0', cinza: '#C9CFC9',
  chumbo: '#7C857C', ambar: '#FFD75E', laranja: '#FF9E4D', magenta: '#FF6FD1',
  violeta: '#B07CFF', azul: '#5A8CFF', vermelho: '#FF5C5C', esmeralda: '#1F9E63',
  turquesa: '#2FBFA8', areia: '#E8D3A0', rosa: '#FFB3C7', prata: '#A9B4C2',
};

const CONJUNTOS = [
  ['verde', 'esmeralda', 'branco'],
  ['ciano', 'azul', 'branco'],
  ['ambar', 'laranja', 'vermelho'],
  ['magenta', 'violeta', 'rosa'],
  ['cinza', 'prata', 'branco'],
  ['verde', 'ciano', 'ambar'],
  ['turquesa', 'ciano', 'areia'],
  ['violeta', 'azul', 'ciano'],
  ['vermelho', 'ambar', 'branco'],
  ['esmeralda', 'turquesa', 'verde'],
  ['prata', 'ciano', 'magenta'],
  ['areia', 'laranja', 'chumbo'],
];

/* -------------------------------------------------------------------- telas */

class Tela {
  constructor(w, h, nomesCores) {
    this.w = w; this.h = h;
    this.paleta = ['transparente', ...nomesCores.map((n) => CORES[n])];
    this.px = new Uint8Array(w * h);
  }
  put(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.px[y * this.w + x];
  }
  ret(x, y, larg, alt, c) {
    for (let j = 0; j < alt; j++) for (let i = 0; i < larg; i++) this.put(x + i, y + j, c);
  }
  moldura(x, y, larg, alt, c) {
    for (let i = 0; i < larg; i++) { this.put(x + i, y, c); this.put(x + i, y + alt - 1, c); }
    for (let j = 0; j < alt; j++) { this.put(x, y + j, c); this.put(x + larg - 1, y + j, c); }
  }
  linhaH(y, x0, x1, c) { for (let x = x0; x <= x1; x++) this.put(x, y, c); }
  linhaV(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.put(x, y, c); }
  disco(cx, cy, r, c) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.put(x, y, c);
  }
  anel(cx, cy, r, esp, c) {
    const ri = r - esp;
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d <= r * r && d > ri * ri) this.put(x, y, c);
      }
  }
  // Carimba um modulo descrito por linhas de texto. '.' = vazio, digitos = indice da cor.
  carimbo(x, y, mapa, deslocaCor = 0) {
    mapa.forEach((linha, j) => {
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === '.' || ch === ' ') continue;
        this.put(x + i, y + j, Number(ch) + deslocaCor);
      }
    });
  }
  espelharH() {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < Math.floor(this.w / 2); x++)
        this.put(this.w - 1 - x, y, this.get(x, y));
  }
  espelharV() {
    for (let y = 0; y < Math.floor(this.h / 2); y++)
      for (let x = 0; x < this.w; x++)
        this.put(x, this.h - 1 - y, this.get(x, y));
  }
  contarPintados() {
    let n = 0;
    for (let i = 0; i < this.px.length; i++) if (this.px[i] !== 0) n++;
    return n;
  }
  rle() {
    const partes = [];
    let atual = this.px[0], cont = 1;
    for (let i = 1; i < this.px.length; i++) {
      if (this.px[i] === atual) cont++;
      else { partes.push(atual + 'x' + cont); atual = this.px[i]; cont = 1; }
    }
    partes.push(atual + 'x' + cont);
    return partes.join(',');
  }
}

const esc = (t) => t / 32;              // fator de escala em relacao a 32x32
const inteiro = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const escolher = (r, lista) => lista[Math.floor(r() * lista.length)];

/* ----------------------------------------------------------------- receitas */
/*
  Cada receita devolve { nome, par, dica }.
  "par" e o tamanho de codigo de referencia (comandos/blocos de uma boa solucao).
  E o alvo da metrica de Eficiencia de Transmissao.
*/

const RECEITAS = {

  /* ============================ REPETICAO ============================ */
  repeticao: [
    {
      id: 'listras-h',
      f(t, r) {
        const passo = inteiro(r, 3, 5) * Math.max(1, Math.round(esc(t.w) / 1.5));
        const esp = Math.max(1, Math.round(passo / 3));
        let c = 1;
        for (let y = 0; y < t.h; y += passo) {
          for (let k = 0; k < esp; k++) t.linhaH(y + k, 0, t.w - 1, c);
          c = (c % (t.paleta.length - 1)) + 1;
        }
        return { nome: 'Listras Horizontais', par: 8, dica: 'Uma repeticao que pula de ' + passo + ' em ' + passo + ' linhas resolve tudo.' };
      },
    },
    {
      id: 'listras-v',
      f(t, r) {
        const passo = inteiro(r, 3, 6) * Math.max(1, Math.round(esc(t.w) / 1.5));
        let c = 1;
        for (let x = 0; x < t.w; x += passo) {
          t.linhaV(x, 0, t.h - 1, c);
          c = (c % (t.paleta.length - 1)) + 1;
        }
        return { nome: 'Colunas de Dados', par: 8, dica: 'Repita uma coluna inteira e depois ande ' + passo + ' pixels para a direita.' };
      },
    },
    {
      id: 'molduras',
      f(t, r) {
        const passo = inteiro(r, 2, 4) * Math.max(1, Math.round(esc(t.w)));
        let c = 1, k = 0;
        for (let d = 0; d < t.w / 2; d += passo) {
          t.moldura(d, d, t.w - 2 * d, t.h - 2 * d, c);
          c = (c % (t.paleta.length - 1)) + 1; k++;
        }
        return { nome: 'Molduras Concentricas', par: 14, dica: 'Cada moldura e a mesma rotina com um recuo maior. Sao ' + k + ' molduras.' };
      },
    },
    {
      id: 'escada',
      f(t, r) {
        const degrau = inteiro(r, 2, 4) * Math.max(1, Math.round(esc(t.w)));
        const espessura = Math.max(1, Math.round(esc(t.w) * inteiro(r, 1, 2)));
        const c = 1;
        let x = 0, y = t.h - espessura;
        while (x < t.w && y >= 0) {
          t.ret(x, y, degrau, espessura, c);
          t.ret(x + degrau - espessura, y - degrau + espessura, espessura, degrau - espessura, c);
          x += degrau; y -= degrau;
        }
        return { nome: 'Escada de Acesso', par: 10, dica: 'O degrau se repete: ande para a direita e depois para cima, sempre igual.' };
      },
    },
    {
      id: 'grade-pontos',
      f(t, r) {
        const passo = inteiro(r, 3, 5) * Math.max(1, Math.round(esc(t.w)));
        const tam = Math.max(1, Math.round(esc(t.w)));
        for (let y = Math.floor(passo / 2); y < t.h; y += passo)
          for (let x = Math.floor(passo / 2); x < t.w; x += passo)
            t.ret(x, y, tam, tam, 1);
        return { nome: 'Grade de Sensores', par: 12, dica: 'Duas repeticoes uma dentro da outra: uma para as linhas, outra para as colunas.' };
      },
    },
    {
      id: 'barras',
      f(t, r) {
        const larg = inteiro(r, 2, 3) * Math.max(1, Math.round(esc(t.w)));
        const vao = Math.max(1, Math.round(esc(t.w)));
        let i = 0;
        for (let x = 0; x + larg <= t.w; x += larg + vao) {
          const alt = Math.min(t.h, (i + 1) * Math.max(2, Math.round(t.h / 12)));
          t.ret(x, t.h - alt, larg, alt, ((i % (t.paleta.length - 1)) + 1));
          i++;
        }
        return { nome: 'Leitura de Energia', par: 12, dica: 'A altura da barra cresce junto com o contador da repeticao.' };
      },
    },
    {
      id: 'ziguezague',
      f(t, r) {
        const amp = inteiro(r, 3, 6) * Math.max(1, Math.round(esc(t.w)));
        const linhas = inteiro(r, 2, 4);
        for (let n = 0; n < linhas; n++) {
          const base = Math.floor(((n + 1) * t.h) / (linhas + 1));
          for (let x = 0; x < t.w; x++) {
            const fase = x % (2 * amp);
            const dy = fase < amp ? fase : 2 * amp - fase;
            t.put(x, base - Math.floor(amp / 2) + dy, n % (t.paleta.length - 1) + 1);
          }
        }
        return { nome: 'Sinal em Zigue-Zague', par: 14, dica: 'Suba enquanto anda, depois desca. O padrao se repete a cada ' + (2 * amp) + ' colunas.' };
      },
    },
    {
      id: 'pente',
      f(t, r) {
        const passo = inteiro(r, 3, 5) * Math.max(1, Math.round(esc(t.w)));
        const alt = Math.floor(t.h * (0.3 + r() * 0.4));
        const base = Math.floor(t.h * 0.75);
        t.linhaH(base, 0, t.w - 1, 1);
        for (let x = 0; x < t.w; x += passo) t.linhaV(x, base - alt, base, 2 % t.paleta.length || 1);
        return { nome: 'Antena Multipla', par: 10, dica: 'Desenhe a base uma vez e repita o dente vertical.' };
      },
    },
    {
      id: 'blocos-xadrez',
      f(t, r) {
        const b = inteiro(r, 2, 4) * Math.max(1, Math.round(esc(t.w) * 2));
        for (let y = 0; y < t.h; y += b)
          for (let x = 0; x < t.w; x += b) {
            const par = (Math.floor(x / b) + Math.floor(y / b)) % 2;
            if (par === 0) t.ret(x, y, b, b, 1);
          }
        return { nome: 'Piso da Ponte', par: 14, dica: 'Blocos de ' + b + ' por ' + b + '. Pinte um bloco sim, um bloco nao.' };
      },
    },
    {
      id: 'cruzes',
      f(t, r) {
        const passo = inteiro(r, 6, 8) * Math.max(1, Math.round(esc(t.w)));
        const br = Math.max(1, Math.round(esc(t.w) * 2));
        for (let y = passo / 2; y < t.h; y += passo)
          for (let x = passo / 2; x < t.w; x += passo) {
            t.linhaH(y, x - br, x + br, 1);
            t.linhaV(x, y - br, y + br, 1);
          }
        return { nome: 'Campo de Cruzes', par: 14, dica: 'Faca um procedimento que desenha uma cruz e chame ele dentro das repeticoes.' };
      },
    },
    {
      id: 'espiral',
      f(t, r) {
        const passo = inteiro(r, 2, 3) * Math.max(1, Math.round(esc(t.w)));
        let x0 = 0, y0 = 0, x1 = t.w - 1, y1 = t.h - 1, c = 1;
        while (x0 <= x1 && y0 <= y1) {
          t.linhaH(y0, x0, x1, c);
          t.linhaV(x1, y0, y1, c);
          t.linhaH(y1, x0, x1, c);
          t.linhaV(x0, y0 + passo, y1, c);
          x0 += passo; y0 += passo; x1 -= passo; y1 -= passo;
        }
        return { nome: 'Espiral de Nucleo', par: 16, dica: 'A cada volta o retangulo encolhe sempre a mesma quantidade.' };
      },
    },
    {
      id: 'diagonais',
      f(t, r) {
        const passo = inteiro(r, 3, 6) * Math.max(1, Math.round(esc(t.w)));
        const esp = Math.max(1, Math.round(esc(t.w) * inteiro(r, 1, 2)));
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++)
            if ((x + y) % passo < esp) t.put(x, y, 1);
        return { nome: 'Faixas Diagonais', par: 12, dica: 'Ande na diagonal repetindo o mesmo passo, ou compare (x + y) com o resto da divisao.' };
      },
    },
    {
      id: 'anel-pontos',
      f(t, r) {
        const n = inteiro(r, 8, 16);
        const raio = Math.floor(t.w * 0.38);
        const cx = t.w / 2 - 0.5, cy = t.h / 2 - 0.5;
        const tam = Math.max(1, Math.round(esc(t.w) * 2));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          t.ret(Math.round(cx + Math.cos(a) * raio), Math.round(cy + Math.sin(a) * raio), tam, tam, 1);
        }
        t.disco(cx, cy, Math.max(1, esc(t.w) * 2), 2 % t.paleta.length || 1);
        return { nome: 'Orbita Sincrona', par: 12, dica: 'Sao ' + n + ' pontos igualmente espacados ao redor do centro.' };
      },
    },
    {
      id: 'torre-modular',
      f(t, r) {
        const alt = inteiro(r, 3, 5) * Math.max(1, Math.round(esc(t.w)));
        const larg = Math.floor(t.w * 0.5);
        const x = Math.floor((t.w - larg) / 2);
        let y = t.h - alt, n = 0;
        while (y > 0) { t.moldura(x, y, larg, alt, (n % 2) + 1); n++; y -= alt; }
        return { nome: 'Torre Modular', par: 12, dica: 'O mesmo andar empilhado ' + n + ' vezes.' };
      },
    },
  ],

  /* ============================ CONDICAO ============================= */
  condicao: [
    {
      id: 'disco',
      f(t, r) {
        const raio = t.w * (0.25 + r() * 0.15);
        t.disco(t.w / 2 - 0.5, t.h / 2 - 0.5, raio, 1);
        return { nome: 'Planeta Solido', par: 12, dica: 'Pinte so quando a distancia ate o centro for menor que o raio.' };
      },
    },
    {
      id: 'losango',
      f(t, r) {
        const raio = Math.floor(t.w * (0.3 + r() * 0.15));
        const cx = Math.floor(t.w / 2), cy = Math.floor(t.h / 2);
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++)
            if (Math.abs(x - cx) + Math.abs(y - cy) <= raio) t.put(x, y, 1);
        return { nome: 'Cristal de Navegacao', par: 12, dica: 'A condicao usa a soma das distancias em x e em y.' };
      },
    },
    {
      id: 'triangulo',
      f(t, r) {
        const invertido = r() > 0.5;
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const cond = invertido ? x <= t.w - 1 - y : x <= y;
            if (cond) t.put(x, y, 1);
          }
        return { nome: invertido ? 'Rampa Invertida' : 'Rampa de Lancamento', par: 10, dica: 'Compare x com y dentro das repeticoes.' };
      },
    },
    {
      id: 'quadrantes',
      f(t, r) {
        const cx = Math.floor(t.w / 2), cy = Math.floor(t.h / 2);
        const nc = t.paleta.length - 1;
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const q = (x < cx ? 0 : 1) + (y < cy ? 0 : 2);
            t.put(x, y, (q % nc) + 1);
          }
        return { nome: 'Setores do Convés', par: 12, dica: 'Duas condicoes combinadas decidem a cor de cada pixel.' };
      },
    },
    {
      id: 'xadrez-fino',
      f(t, r) {
        const p = inteiro(r, 1, 2) * Math.max(1, Math.round(esc(t.w)));
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++)
            if ((Math.floor(x / p) + Math.floor(y / p)) % 2 === 0) t.put(x, y, 1);
        return { nome: 'Malha de Verificacao', par: 12, dica: 'Use o resto da divisao por 2 para decidir se pinta.' };
      },
    },
    {
      id: 'aneis',
      f(t, r) {
        const passo = inteiro(r, 2, 4) * Math.max(1, Math.round(esc(t.w)));
        const cx = t.w / 2 - 0.5, cy = t.h / 2 - 0.5;
        const nc = t.paleta.length - 1;
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const d = Math.floor(Math.sqrt((x - cx) ** 2 + (y - cy) ** 2));
            if (Math.floor(d / passo) % 2 === 0) t.put(x, y, (Math.floor(d / passo) / 2 % nc) + 1);
          }
        return { nome: 'Eco de Radar', par: 14, dica: 'Calcule a distancia ate o centro e teste se ela cai numa faixa par.' };
      },
    },
    {
      id: 'xor',
      f(t, r) {
        const nc = t.paleta.length - 1;
        const div = Math.max(1, Math.round(esc(t.w)));
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const a = Math.floor(x / div), b = Math.floor(y / div);
            if ((a & b) === 0) t.put(x, y, ((a + b) % nc) + 1);
          }
        return { nome: 'Fractal Alienigena', par: 14, dica: 'Um padrao antigo: teste se x e y nao compartilham nenhum bit.' };
      },
    },
    {
      id: 'degraus-cor',
      f(t, r) {
        const nc = t.paleta.length - 1;
        const faixas = inteiro(r, 4, 8);
        const alt = Math.ceil(t.h / faixas);
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++)
            t.put(x, y, (Math.floor(y / alt) % nc) + 1);
        return { nome: 'Atmosfera em Camadas', par: 12, dica: 'A cor depende de qual faixa de altura o cursor esta.' };
      },
    },
    {
      id: 'ampulheta',
      f(t, r) {
        const cx = t.w / 2 - 0.5, cy = t.h / 2 - 0.5;
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++)
            if (Math.abs(x - cx) <= Math.abs(y - cy)) t.put(x, y, 1);
        return { nome: 'Ampulheta de Salto', par: 10, dica: 'Compare o afastamento horizontal com o vertical.' };
      },
    },
    {
      id: 'onda',
      f(t, r) {
        const amp = t.h * (0.15 + r() * 0.2);
        const per = t.w / inteiro(r, 1, 3);
        const esp = Math.max(1, Math.round(esc(t.w) * 2));
        for (let x = 0; x < t.w; x++) {
          const y = Math.round(t.h / 2 + Math.sin((x / per) * Math.PI * 2) * amp);
          for (let k = 0; k < esp; k++) t.put(x, y + k, 1);
        }
        return { nome: 'Onda de Radio', par: 12, dica: 'Para cada coluna, calcule a altura e pinte so ali.' };
      },
    },
    {
      id: 'mod-multiplos',
      f(t, r) {
        const k = inteiro(r, 3, 7);
        const nc = t.paleta.length - 1;
        const div = Math.max(1, Math.round(esc(t.w)));
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const v = (Math.floor(x / div) * Math.floor(y / div)) % k;
            if (v === 0) t.put(x, y, ((Math.floor(x / div) + Math.floor(y / div)) % nc) + 1);
          }
        return { nome: 'Tabuada Estelar', par: 14, dica: 'Pinte quando x vezes y for multiplo de ' + k + '.' };
      },
    },
    {
      id: 'moldura-cheia',
      f(t, r) {
        const m = inteiro(r, 2, 5) * Math.max(1, Math.round(esc(t.w)));
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const borda = x < m || y < m || x >= t.w - m || y >= t.h - m;
            t.put(x, y, borda ? 1 : (2 % t.paleta.length || 1));
          }
        return { nome: 'Escotilha Reforcada', par: 10, dica: 'Uma condicao decide se o pixel e borda ou miolo.' };
      },
    },
    {
      id: 'estrela-quatro',
      f(t, r) {
        const cx = t.w / 2 - 0.5, cy = t.h / 2 - 0.5;
        const raio = t.w * 0.45;
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
            if (dx + dy <= raio && (dx < raio * 0.18 || dy < raio * 0.18 || dx + dy < raio * 0.45)) t.put(x, y, 1);
          }
        return { nome: 'Estrela Guia', par: 14, dica: 'Junte varias condicoes com o operador OU.' };
      },
    },
    {
      id: 'meia-lua',
      f(t, r) {
        const cx = t.w / 2 - 0.5, cy = t.h / 2 - 0.5;
        const raio = t.w * 0.4;
        const desl = raio * (0.35 + r() * 0.25);
        for (let y = 0; y < t.h; y++)
          for (let x = 0; x < t.w; x++) {
            const dentro = (x - cx) ** 2 + (y - cy) ** 2 <= raio * raio;
            const recorte = (x - cx - desl) ** 2 + (y - cy) ** 2 <= raio * raio;
            if (dentro && !recorte) t.put(x, y, 1);
          }
        return { nome: 'Fase da Lua', par: 14, dica: 'Dentro de um circulo E fora do outro.' };
      },
    },
  ],

  /* =========================== PROCEDIMENTO ========================== */
  procedimento: [
    {
      id: 'frota',
      f(t, r) {
        const nave = ['..1..', '.111.', '11111', '.1.1.'];
        const cols = inteiro(r, 2, 4), lins = inteiro(r, 2, 4);
        const e = Math.max(1, Math.round(esc(t.w)));
        const mw = 5 * e, mh = 4 * e;
        const px = Math.floor((t.w - cols * mw) / (cols + 1));
        const py = Math.floor((t.h - lins * mh) / (lins + 1));
        const ox = Math.floor((t.w - (cols * mw + (cols - 1) * px)) / 2);
        const oy = Math.floor((t.h - (lins * mh + (lins - 1) * py)) / 2);
        for (let j = 0; j < lins; j++)
          for (let i = 0; i < cols; i++)
            carimboEscalado(t, ox + i * (mw + px), oy + j * (mh + py), nave, e, 1);
        return { nome: 'Frota de Reconhecimento', par: 16, dica: 'Escreva um procedimento "nave" e chame ele ' + (cols * lins) + ' vezes em posicoes diferentes.' };
      },
    },
    {
      id: 'invasores',
      f(t, r) {
        const alien = ['.1...1.', '..111..', '.11111.', '1.111.1', '1.1.1.1'];
        const cols = inteiro(r, 2, 3), lins = inteiro(r, 2, 3);
        const e = Math.max(1, Math.round(esc(t.w)));
        const mw = 7 * e, mh = 5 * e;
        const px = Math.floor((t.w - cols * mw) / (cols + 1));
        const py = Math.floor((t.h - lins * mh) / (lins + 1));
        const ox = Math.floor((t.w - (cols * mw + (cols - 1) * px)) / 2);
        const oy = Math.floor((t.h - (lins * mh + (lins - 1) * py)) / 2);
        for (let j = 0; j < lins; j++)
          for (let i = 0; i < cols; i++)
            carimboEscalado(t, ox + i * (mw + px), oy + j * (mh + py), alien, e, ((i + j) % (t.paleta.length - 1)) + 1);
        return { nome: 'Contato Nao Identificado', par: 16, dica: 'Um procedimento com parametros de posicao economiza muito codigo.' };
      },
    },
    {
      id: 'quatro-cantos',
      f(t, r) {
        const tam = Math.floor(t.w * 0.3);
        const m = Math.max(1, Math.round(esc(t.w)));
        const desenhar = (x, y) => {
          t.moldura(x, y, tam, tam, 1);
          t.ret(x + m * 2, y + m * 2, tam - m * 4, tam - m * 4, 2 % t.paleta.length || 1);
        };
        desenhar(m, m);
        desenhar(t.w - tam - m, m);
        desenhar(m, t.h - tam - m);
        desenhar(t.w - tam - m, t.h - tam - m);
        return { nome: 'Marcadores de Ancoragem', par: 14, dica: 'O mesmo modulo em quatro cantos. Um procedimento com x e y resolve.' };
      },
    },
    {
      id: 'planeta-luas',
      f(t, r) {
        const cx = t.w / 2 - 0.5, cy = t.h / 2 - 0.5;
        t.disco(cx, cy, t.w * 0.22, 1);
        const n = inteiro(r, 3, 6);
        const raio = t.w * 0.38;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + 0.3;
          t.disco(cx + Math.cos(a) * raio, cy + Math.sin(a) * raio, Math.max(1, t.w * 0.055), 2 % t.paleta.length || 1);
        }
        return { nome: 'Sistema com ' + n + ' Luas', par: 16, dica: 'Faca um procedimento "circulo" e reaproveite para o planeta e para as luas.' };
      },
    },
    {
      id: 'simetria-quatro',
      f(t, r) {
        const qw = Math.floor(t.w / 2), qh = Math.floor(t.h / 2);
        const blocos = inteiro(r, 5, 9);
        const b = Math.max(1, Math.round(esc(t.w) * 2));
        for (let i = 0; i < blocos; i++) {
          const x = inteiro(r, 0, qw - b), y = inteiro(r, 0, qh - b);
          t.ret(x, y, b, b, inteiro(r, 1, t.paleta.length - 1));
        }
        t.espelharH(); t.espelharV();
        return { nome: 'Selo Simetrico', par: 16, dica: 'Desenhe so um quarto e repita espelhando com um procedimento.' };
      },
    },
    {
      id: 'torres',
      f(t, r) {
        const n = inteiro(r, 3, 5);
        const larg = Math.floor(t.w / (n * 2));
        for (let i = 0; i < n; i++) {
          const x = Math.floor((i + 0.5) * (t.w / n) - larg / 2);
          const alt = Math.floor(t.h * (0.3 + ((i % 3) * 0.2)));
          t.moldura(x, t.h - alt, larg, alt, 1);
          t.linhaV(x + Math.floor(larg / 2), t.h - alt - Math.floor(alt * 0.2), t.h - alt, 2 % t.paleta.length || 1);
        }
        return { nome: 'Torres de Comunicacao', par: 16, dica: 'Um procedimento "torre" que recebe a altura como parametro.' };
      },
    },
    {
      id: 'cristais',
      f(t, r) {
        const n = inteiro(r, 3, 5);
        const raio = Math.floor(t.w / (n * 2.4));
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            const cx = Math.floor((i + 0.5) * (t.w / n));
            const cy = Math.floor((j + 0.5) * (t.h / n));
            for (let y = -raio; y <= raio; y++)
              for (let x = -raio; x <= raio; x++)
                if (Math.abs(x) + Math.abs(y) <= raio) t.put(cx + x, cy + y, ((i + j) % (t.paleta.length - 1)) + 1);
          }
        return { nome: 'Deposito de Cristais', par: 16, dica: 'Um procedimento "losango" chamado dentro de duas repeticoes.' };
      },
    },
    {
      id: 'flor-radial',
      f(t, r) {
        const cx = Math.floor(t.w / 2), cy = Math.floor(t.h / 2);
        const petalas = escolher(r, [4, 8]);
        const comp = Math.floor(t.w * 0.35), larg = Math.max(1, Math.round(esc(t.w) * 2));
        for (let i = 0; i < petalas; i++) {
          const a = (i / petalas) * Math.PI * 2;
          for (let d = 3; d < comp; d++)
            for (let k = -larg; k <= larg; k++) {
              const x = cx + Math.cos(a) * d - Math.sin(a) * k;
              const y = cy + Math.sin(a) * d + Math.cos(a) * k;
              t.put(x, y, 1);
            }
        }
        t.disco(cx, cy, larg + 1, 2 % t.paleta.length || 1);
        return { nome: 'Rotor de ' + petalas + ' Pas', par: 16, dica: 'A mesma pa desenhada em ' + petalas + ' direcoes.' };
      },
    },
    {
      id: 'foguetes',
      f(t, r) {
        const foguete = ['..1..', '.111.', '.1.1.', '.111.', '2...2'];
        const n = inteiro(r, 2, 4);
        const e = Math.max(1, Math.round(esc(t.w) * 1.5));
        const mw = 5 * e;
        const px = Math.floor((t.w - n * mw) / (n + 1));
        const ox = Math.floor((t.w - (n * mw + (n - 1) * px)) / 2);
        for (let i = 0; i < n; i++)
          carimboEscalado(t, ox + i * (mw + px), Math.floor((t.h - 5 * e) / 2), foguete, e, 0);
        return { nome: 'Doca de ' + n + ' Foguetes', par: 14, dica: 'Um procedimento por foguete. So a posicao muda.' };
      },
    },
    {
      id: 'satelites',
      f(t, r) {
        const sat = ['1.1', '111', '1.1'];
        const n = inteiro(r, 4, 8);
        const e = Math.max(1, Math.round(esc(t.w) * 2));
        const cx = t.w / 2 - 0.5, cy = t.h / 2 - 0.5;
        const raio = t.w * 0.34;
        t.anel(cx, cy, t.w * 0.12, Math.max(1, esc(t.w)), 2 % t.paleta.length || 1);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          carimboEscalado(t, Math.round(cx + Math.cos(a) * raio - e), Math.round(cy + Math.sin(a) * raio - e), sat, e, 0);
        }
        return { nome: 'Rede de ' + n + ' Satelites', par: 16, dica: 'Chame o mesmo procedimento ' + n + ' vezes ao redor do centro.' };
      },
    },
    {
      id: 'mosaico-modulo',
      f(t, r) {
        const mods = [
          ['1..1', '.11.', '.11.', '1..1'],
          ['.11.', '1..1', '1..1', '.11.'],
          ['1111', '1..1', '1..1', '1111'],
          ['..1.', '.111', '111.', '.1..'],
        ];
        const m = escolher(r, mods);
        const e = Math.max(1, Math.round(esc(t.w)));
        const mw = 4 * e, vao = e;
        let n = 0;
        for (let y = vao; y + mw <= t.h; y += mw + vao)
          for (let x = vao; x + mw <= t.w; x += mw + vao) {
            carimboEscalado(t, x, y, m, e, ((n % (t.paleta.length - 1))));
            n++;
          }
        return { nome: 'Mosaico de Casco', par: 16, dica: 'Um procedimento desenha o modulo. As repeticoes espalham ele ' + n + ' vezes.' };
      },
    },
    {
      id: 'bandeira-modulos',
      f(t, r) {
        const e = Math.max(1, Math.round(esc(t.w)));
        const barra = Math.floor(t.h / 5);
        for (let i = 0; i < 5; i++) {
          if (i % 2 === 0) t.ret(0, i * barra, t.w, barra, 1);
        }
        const glifo = ['.1.', '111', '.1.'];
        const n = inteiro(r, 3, 5);
        for (let i = 0; i < n; i++)
          carimboEscalado(t, Math.floor((i + 0.5) * (t.w / n)) - e, Math.floor(t.h / 2 - e), glifo, e * 2, 1);
        return { nome: 'Estandarte da Frota', par: 16, dica: 'Faixas com repeticao e o glifo com um procedimento.' };
      },
    },
  ],
};

function carimboEscalado(t, x, y, mapa, e, deslocaCor) {
  mapa.forEach((linha, j) => {
    for (let i = 0; i < linha.length; i++) {
      const ch = linha[i];
      if (ch === '.' || ch === ' ') continue;
      const cor = ((Number(ch) - 1 + deslocaCor) % (t.paleta.length - 1)) + 1;
      for (let b = 0; b < e; b++) for (let a = 0; a < e; a++) t.put(x + i * e + a, y + j * e + b, cor);
    }
  });
}

/* ---------------------------------------------------------------- producao */

const PREFIXO = { repeticao: 'rep', condicao: 'cond', procedimento: 'proc' };

function slug(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function gerarUma(tamanho, categoria, indice) {
  const semente = hashTexto(`${tamanho}|${categoria}|${indice}`);
  const r = mulberry32(semente);
  const receitas = RECEITAS[categoria];
  const receita = receitas[indice % receitas.length];
  const cores = escolher(r, CONJUNTOS);
  const tela = new Tela(tamanho, tamanho, cores);
  const meta = receita.f(tela, r);
  const pintados = tela.contarPintados();
  if (pintados < tamanho * tamanho * 0.03) return null; // arte vazia demais
  return {
    id: `${PREFIXO[categoria]}-${String(indice + 1).padStart(3, '0')}`,
    nome: meta.nome,
    categoria,
    receita: receita.id,
    largura: tamanho,
    altura: tamanho,
    par: meta.par + Math.round(Math.log2(tamanho / 32) * 2),
    dica: meta.dica,
    paleta: tela.paleta,
    pintados,
    pixels: tela.rle(),
  };
}

function main() {
  const args = process.argv.slice(2);
  const valor = (flag, padrao) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : padrao;
  };
  const porCategoria = Number(valor('--por-categoria', '50'));
  const niveis = valor('--niveis', '32,64,128').split(',').map(Number);
  const limpar = args.includes('--limpar');

  let total = 0;
  for (const t of niveis) {
    const pasta = join(ATIVIDADES, `nivel-${t}`);
    if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });
    if (limpar) for (const f of readdirSync(pasta)) if (f.endsWith('.json')) unlinkSync(join(pasta, f));

    for (const categoria of Object.keys(RECEITAS)) {
      let feitas = 0, i = 0;
      while (feitas < porCategoria && i < porCategoria * 4) {
        const arte = gerarUma(t, categoria, i);
        i++;
        if (!arte) continue;
        arte.id = `${PREFIXO[categoria]}-${String(feitas + 1).padStart(3, '0')}`;
        const nome = `${arte.id}-${slug(arte.nome)}.json`;
        writeFileSync(join(pasta, nome), JSON.stringify(arte));
        feitas++; total++;
      }
      console.log(`nivel-${t}/${categoria}: ${feitas} artes`);
    }
  }
  console.log(`\nTotal: ${total} artes geradas.`);
  console.log('Agora rode: node ferramentas/atualizar-catalogo.mjs');
}

main();
