/*
  exercicios.mjs — Os exercicios do modo Tutorial, escritos uma vez so.

  Cada exercicio traz o programa CORRETO em Portugol. A partir dele o gerador
  produz tudo o mais:
    - a arte alvo, executando o programa num grid em branco
    - a versao em blocos, convertendo a arvore
    - o codigo inicial com erros, aplicando as trocas de "mutacoes"

  Assim as duas linguagens nunca ficam fora de sincronia.

  Cada mutacao e um par [de, para]. O texto "de" precisa aparecer no programa.
*/

const VERDE = 'pixel.cor(59, 255, 158)';
const CIANO = 'pixel.cor(77, 225, 255)';
const AMBAR = 'pixel.cor(255, 215, 94)';
const MAGENTA = 'pixel.cor(255, 111, 209)';

export const EXERCICIOS = [

  /* ====================================================== REPETICAO ==== */
  {
    categoria: 'repeticao', nome: 'Linha de Transmissao', tamanho: 32,
    dica: 'A repeticao precisa cobrir a largura inteira do grid.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro x = 0; x < 32; x++) {
      pixel.ir_para(x, 16)
      pixel.pintar(${VERDE})
    }
  }
}`,
    mutacoes: [['x < 32', 'x < 12']],
  },
  {
    categoria: 'repeticao', nome: 'Antena Vertical', tamanho: 32,
    dica: 'Aqui quem muda a cada volta e o y, nao o x.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      pixel.ir_para(10, y)
      pixel.pintar(${CIANO})
    }
  }
}`,
    mutacoes: [['pixel.ir_para(10, y)', 'pixel.ir_para(y, 10)']],
  },
  {
    categoria: 'repeticao', nome: 'Casco Externo', tamanho: 32,
    dica: 'Sao quatro repeticoes: topo, base e as duas laterais.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro x = 0; x < 32; x++) {
      pixel.ir_para(x, 0)
      pixel.pintar(${VERDE})
      pixel.ir_para(x, 31)
      pixel.pintar(${VERDE})
    }
    para (inteiro y = 0; y < 32; y++) {
      pixel.ir_para(0, y)
      pixel.pintar(${VERDE})
      pixel.ir_para(31, y)
      pixel.pintar(${VERDE})
    }
  }
}`,
    mutacoes: [['pixel.ir_para(x, 31)', 'pixel.ir_para(x, 32)'], ['pixel.ir_para(31, y)', 'pixel.ir_para(30, y)']],
  },
  {
    categoria: 'repeticao', nome: 'Rota Diagonal', tamanho: 32,
    dica: 'O mesmo contador serve para as duas coordenadas.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro i = 0; i < 32; i++) {
      pixel.ir_para(i, i)
      pixel.pintar(${AMBAR})
    }
  }
}`,
    mutacoes: [['pixel.ir_para(i, i)', 'pixel.ir_para(i, 0)']],
  },
  {
    categoria: 'repeticao', nome: 'Listras do Convés', tamanho: 32,
    dica: 'O contador de fora pula de quatro em quatro linhas.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y += 4) {
      para (inteiro x = 0; x < 32; x++) {
        pixel.ir_para(x, y)
        pixel.pintar(${VERDE})
      }
    }
  }
}`,
    mutacoes: [['y += 4', 'y += 1']],
  },
  {
    categoria: 'repeticao', nome: 'Grade de Sensores', tamanho: 32,
    dica: 'Duas repeticoes, as duas pulando de cinco em cinco.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 2; y < 32; y += 5) {
      para (inteiro x = 2; x < 32; x += 5) {
        pixel.ir_para(x, y)
        pixel.pintar(${CIANO})
      }
    }
  }
}`,
    mutacoes: [['x = 2; x < 32; x += 5', 'x = 2; x < 32; x += 1']],
  },
  {
    categoria: 'repeticao', nome: 'Escada de Acesso', tamanho: 32,
    dica: 'A cada degrau o cursor anda para o lado e desce a mesma quantidade.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro i = 0; i < 8; i++) {
      para (inteiro k = 0; k < 4; k++) {
        pixel.ir_para(i * 4 + k, i * 4)
        pixel.pintar(${VERDE})
        pixel.ir_para(i * 4 + 3, i * 4 + k)
        pixel.pintar(${VERDE})
      }
    }
  }
}`,
    mutacoes: [['i * 4 + k, i * 4', 'i * 4 + k, i * 2']],
  },
  {
    categoria: 'repeticao', nome: 'Bloco de Carga', tamanho: 32,
    dica: 'Um retangulo cheio: uma repeticao para as linhas e outra para as colunas.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 8; y < 24; y++) {
      para (inteiro x = 8; x < 24; x++) {
        pixel.ir_para(x, y)
        pixel.pintar(${MAGENTA})
      }
    }
  }
}`,
    mutacoes: [['x = 8; x < 24', 'x = 8; x < 16']],
  },
  {
    categoria: 'repeticao', nome: 'Leitura de Energia', tamanho: 32,
    dica: 'A altura de cada barra vem do proprio contador.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro i = 0; i < 8; i++) {
      para (inteiro k = 0; k < i * 4 + 1; k++) {
        pixel.ir_para(i * 4, 31 - k)
        pixel.pintar(${AMBAR})
        pixel.ir_para(i * 4 + 1, 31 - k)
        pixel.pintar(${AMBAR})
      }
    }
  }
}`,
    mutacoes: [['k < i * 4 + 1', 'k < 4']],
  },
  {
    categoria: 'repeticao', nome: 'Sinal Alternado', tamanho: 32,
    dica: 'Suba quatro, desca quatro, e repita.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro i = 0; i < 4; i++) {
      para (inteiro k = 0; k < 8; k++) {
        pixel.ir_para(i * 8 + k, 12 + k)
        pixel.pintar(${CIANO})
        pixel.ir_para(i * 8 + k, 19 - k)
        pixel.pintar(${CIANO})
      }
    }
  }
}`,
    mutacoes: [['19 - k', '19 + k']],
  },
  {
    categoria: 'repeticao', nome: 'Mira Central', tamanho: 32,
    dica: 'Uma repeticao para a barra deitada e outra para a barra em pe.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro i = 4; i < 28; i++) {
      pixel.ir_para(i, 16)
      pixel.pintar(${VERDE})
      pixel.ir_para(16, i)
      pixel.pintar(${VERDE})
    }
  }
}`,
    mutacoes: [['pixel.ir_para(16, i)', 'pixel.ir_para(i, 16)']],
  },
  {
    categoria: 'repeticao', nome: 'Molduras Encaixadas', tamanho: 32,
    dica: 'Cada moldura e a mesma ideia com um recuo maior.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro d = 0; d < 3; d++) {
      para (inteiro i = d * 5; i < 32 - d * 5; i++) {
        pixel.ir_para(i, d * 5)
        pixel.pintar(${VERDE})
        pixel.ir_para(i, 31 - d * 5)
        pixel.pintar(${VERDE})
        pixel.ir_para(d * 5, i)
        pixel.pintar(${VERDE})
        pixel.ir_para(31 - d * 5, i)
        pixel.pintar(${VERDE})
      }
    }
  }
}`,
    mutacoes: [['i < 32 - d * 5', 'i < 32']],
  },

  /* ======================================================= CONDICAO ==== */
  {
    categoria: 'condicao', nome: 'Malha de Verificacao', tamanho: 32,
    dica: 'O resto da divisao por dois separa as casas do tabuleiro.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        se ((x + y) % 2 == 0) {
          pixel.ir_para(x, y)
          pixel.pintar(${VERDE})
        }
      }
    }
  }
}`,
    mutacoes: [['(x + y) % 2 == 0', '(x + y) % 2 == 1']],
  },
  {
    categoria: 'condicao', nome: 'Divisao de Setores', tamanho: 32,
    dica: 'Compare o y com a metade da altura.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        pixel.ir_para(x, y)
        se (y < 16) {
          pixel.pintar(${CIANO})
        } senao {
          pixel.pintar(${MAGENTA})
        }
      }
    }
  }
}`,
    mutacoes: [['se (y < 16)', 'se (y < 4)']],
  },
  {
    categoria: 'condicao', nome: 'Rampa de Lancamento', tamanho: 32,
    dica: 'Pinte so quando x for menor ou igual a y.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        se (x <= y) {
          pixel.ir_para(x, y)
          pixel.pintar(${AMBAR})
        }
      }
    }
  }
}`,
    mutacoes: [['x <= y', 'x >= y']],
  },
  {
    categoria: 'condicao', nome: 'Planeta Solido', tamanho: 32,
    dica: 'A distancia ao quadrado evita precisar de raiz.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        inteiro dx = x - 16
        inteiro dy = y - 16
        se (dx * dx + dy * dy < 144) {
          pixel.ir_para(x, y)
          pixel.pintar(${CIANO})
        }
      }
    }
  }
}`,
    mutacoes: [['dx * dx + dy * dy < 144', 'dx + dy < 144']],
  },
  {
    categoria: 'condicao', nome: 'Cristal de Navegacao', tamanho: 32,
    dica: 'Some as distancias em x e em y, sempre sem sinal.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        se (matematica.abs(x - 16) + matematica.abs(y - 16) < 13) {
          pixel.ir_para(x, y)
          pixel.pintar(${MAGENTA})
        }
      }
    }
  }
}`,
    mutacoes: [['matematica.abs(y - 16) < 13', 'matematica.abs(y - 16) < 26']],
  },
  {
    categoria: 'condicao', nome: 'Atmosfera em Camadas', tamanho: 32,
    dica: 'A divisao inteira transforma a altura em numero da faixa.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        pixel.ir_para(x, y)
        se (y / 8 % 2 == 0) {
          pixel.pintar(${VERDE})
        } senao {
          pixel.pintar(${AMBAR})
        }
      }
    }
  }
}`,
    mutacoes: [['y / 8 % 2 == 0', 'y / 2 % 2 == 0']],
  },
  {
    categoria: 'condicao', nome: 'Multiplos de Tres', tamanho: 32,
    dica: 'Pinte a coluna so quando o resto da divisao por tres for zero.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro x = 0; x < 32; x++) {
      se (x % 3 == 0) {
        para (inteiro y = 0; y < 32; y++) {
          pixel.ir_para(x, y)
          pixel.pintar(${CIANO})
        }
      }
    }
  }
}`,
    mutacoes: [['x % 3 == 0', 'x % 2 == 0']],
  },
  {
    categoria: 'condicao', nome: 'Ampulheta de Salto', tamanho: 32,
    dica: 'Compare o afastamento horizontal com o vertical.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        se (matematica.abs(x - 16) <= matematica.abs(y - 16)) {
          pixel.ir_para(x, y)
          pixel.pintar(${VERDE})
        }
      }
    }
  }
}`,
    mutacoes: [['<= matematica.abs(y - 16)', '>= matematica.abs(y - 16)']],
  },
  {
    categoria: 'condicao', nome: 'Escotilha Reforcada', tamanho: 32,
    dica: 'Junte quatro testes com o operador ou.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        pixel.ir_para(x, y)
        se (x < 3 ou y < 3 ou x > 28 ou y > 28) {
          pixel.pintar(${AMBAR})
        } senao {
          pixel.pintar(${MAGENTA})
        }
      }
    }
  }
}`,
    mutacoes: [['x < 3 ou y < 3 ou x > 28 ou y > 28', 'x < 3 e y < 3 e x > 28 e y > 28']],
  },
  {
    categoria: 'condicao', nome: 'Quadrantes do Convés', tamanho: 32,
    dica: 'Duas condicoes encaixadas dao os quatro pedacos.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        pixel.ir_para(x, y)
        se (x < 16) {
          se (y < 16) {
            pixel.pintar(${VERDE})
          } senao {
            pixel.pintar(${CIANO})
          }
        } senao {
          se (y < 16) {
            pixel.pintar(${AMBAR})
          } senao {
            pixel.pintar(${MAGENTA})
          }
        }
      }
    }
  }
}`,
    mutacoes: [['se (x < 16) {\n          se (y < 16)', 'se (x < 16) {\n          se (y < 8)']],
  },
  {
    categoria: 'condicao', nome: 'Anel de Radar', tamanho: 32,
    dica: 'Dentro de um circulo e fora de outro, ao mesmo tempo.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        inteiro d = (x - 16) * (x - 16) + (y - 16) * (y - 16)
        se (d < 196 e d > 100) {
          pixel.ir_para(x, y)
          pixel.pintar(${CIANO})
        }
      }
    }
  }
}`,
    mutacoes: [['d < 196 e d > 100', 'd < 196 ou d > 100']],
  },
  {
    categoria: 'condicao', nome: 'Leitura do Proprio Traco', tamanho: 32,
    dica: 'Use a cor que ja esta no grid para decidir a proxima.',
    fonte: `programa {
  funcao inicio() {
    para (inteiro x = 0; x < 32; x++) {
      pixel.ir_para(x, 10)
      se (x % 4 == 0) {
        pixel.pintar(${VERDE})
      }
    }
    para (inteiro x = 0; x < 32; x++) {
      se (pixel.vazio(pixel.cor_em(x, 10))) {
        pixel.ir_para(x, 20)
        pixel.pintar(${MAGENTA})
      }
    }
  }
}`,
    mutacoes: [['pixel.vazio(pixel.cor_em(x, 10))', 'pixel.vazio(pixel.cor_em(x, 20))']],
  },

  /* =================================================== PROCEDIMENTO ==== */
  {
    categoria: 'procedimento', nome: 'Tres Transmissoes', tamanho: 32,
    dica: 'O procedimento recebe a linha como parametro.',
    fonte: `programa {
  funcao linha(inteiro y, inteiro cor) {
    para (inteiro x = 0; x < 32; x++) {
      pixel.ir_para(x, y)
      pixel.pintar(cor)
    }
  }
  funcao inicio() {
    linha(6, ${VERDE})
    linha(16, ${CIANO})
    linha(26, ${AMBAR})
  }
}`,
    mutacoes: [['linha(16, ' + CIANO + ')', 'linha(6, ' + CIANO + ')']],
  },
  {
    categoria: 'procedimento', nome: 'Marcadores de Ancoragem', tamanho: 32,
    dica: 'O mesmo quadrado nos quatro cantos, so mudando a posicao.',
    fonte: `programa {
  funcao quadrado(inteiro ox, inteiro oy, inteiro cor) {
    para (inteiro i = 0; i < 8; i++) {
      pixel.ir_para(ox + i, oy)
      pixel.pintar(cor)
      pixel.ir_para(ox + i, oy + 7)
      pixel.pintar(cor)
      pixel.ir_para(ox, oy + i)
      pixel.pintar(cor)
      pixel.ir_para(ox + 7, oy + i)
      pixel.pintar(cor)
    }
  }
  funcao inicio() {
    quadrado(1, 1, ${VERDE})
    quadrado(23, 1, ${VERDE})
    quadrado(1, 23, ${VERDE})
    quadrado(23, 23, ${VERDE})
  }
}`,
    mutacoes: [['quadrado(23, 1, ' + VERDE + ')', 'quadrado(1, 1, ' + VERDE + ')']],
  },
  {
    categoria: 'procedimento', nome: 'Chuva de Pontos', tamanho: 32,
    dica: 'Um procedimento bem pequeno, chamado dentro de duas repeticoes.',
    fonte: `programa {
  funcao ponto(inteiro x, inteiro y) {
    pixel.ir_para(x, y)
    pixel.pintar(${CIANO})
  }
  funcao inicio() {
    para (inteiro j = 0; j < 8; j++) {
      para (inteiro i = 0; i < 8; i++) {
        ponto(i * 4 + 1, j * 4 + 1)
      }
    }
  }
}`,
    mutacoes: [['ponto(i * 4 + 1, j * 4 + 1)', 'ponto(i * 4 + 1, 1)']],
  },
  {
    categoria: 'procedimento', nome: 'Duas Miras', tamanho: 32,
    dica: 'O procedimento recebe o centro da cruz.',
    fonte: `programa {
  funcao cruz(inteiro cx, inteiro cy, inteiro cor) {
    para (inteiro i = 0; i < 11; i++) {
      pixel.ir_para(cx - 5 + i, cy)
      pixel.pintar(cor)
      pixel.ir_para(cx, cy - 5 + i)
      pixel.pintar(cor)
    }
  }
  funcao inicio() {
    cruz(8, 8, ${VERDE})
    cruz(23, 23, ${MAGENTA})
  }
}`,
    mutacoes: [['pixel.ir_para(cx, cy - 5 + i)', 'pixel.ir_para(cx, cy)']],
  },
  {
    categoria: 'procedimento', nome: 'Colunas da Ponte', tamanho: 32,
    dica: 'Chame o procedimento dentro de uma repeticao.',
    fonte: `programa {
  funcao coluna(inteiro x, inteiro cor) {
    para (inteiro y = 0; y < 32; y++) {
      pixel.ir_para(x, y)
      pixel.pintar(cor)
    }
  }
  funcao inicio() {
    para (inteiro i = 0; i < 6; i++) {
      coluna(i * 6 + 1, ${AMBAR})
    }
  }
}`,
    mutacoes: [['coluna(i * 6 + 1, ' + AMBAR + ')', 'coluna(1, ' + AMBAR + ')']],
  },
  {
    categoria: 'procedimento', nome: 'Moldura Ajustavel', tamanho: 32,
    dica: 'O tamanho da moldura tambem e um parametro.',
    fonte: `programa {
  funcao moldura(inteiro ox, inteiro oy, inteiro tam, inteiro cor) {
    para (inteiro i = 0; i < tam; i++) {
      pixel.ir_para(ox + i, oy)
      pixel.pintar(cor)
      pixel.ir_para(ox + i, oy + tam - 1)
      pixel.pintar(cor)
      pixel.ir_para(ox, oy + i)
      pixel.pintar(cor)
      pixel.ir_para(ox + tam - 1, oy + i)
      pixel.pintar(cor)
    }
  }
  funcao inicio() {
    moldura(0, 0, 32, ${VERDE})
    moldura(6, 6, 20, ${CIANO})
    moldura(12, 12, 8, ${MAGENTA})
  }
}`,
    mutacoes: [['moldura(12, 12, 8, ' + MAGENTA + ')', 'moldura(12, 12, 4, ' + MAGENTA + ')']],
  },
  {
    categoria: 'procedimento', nome: 'Frota de Sondas', tamanho: 32,
    dica: 'Uma sonda desenhada tres vezes em posicoes diferentes.',
    fonte: `programa {
  funcao sonda(inteiro ox, inteiro oy, inteiro cor) {
    pixel.ir_para(ox + 2, oy)
    pixel.pintar(cor)
    para (inteiro i = 1; i < 4; i++) {
      pixel.ir_para(ox + i, oy + 1)
      pixel.pintar(cor)
    }
    para (inteiro i = 0; i < 5; i++) {
      pixel.ir_para(ox + i, oy + 2)
      pixel.pintar(cor)
    }
    pixel.ir_para(ox + 1, oy + 3)
    pixel.pintar(cor)
    pixel.ir_para(ox + 3, oy + 3)
    pixel.pintar(cor)
  }
  funcao inicio() {
    para (inteiro i = 0; i < 3; i++) {
      sonda(i * 10 + 2, 6, ${VERDE})
      sonda(i * 10 + 2, 20, ${CIANO})
    }
  }
}`,
    mutacoes: [['sonda(i * 10 + 2, 20, ' + CIANO + ')', 'sonda(i * 10 + 2, 6, ' + CIANO + ')']],
  },
  {
    categoria: 'procedimento', nome: 'Escadas Paralelas', tamanho: 32,
    dica: 'O procedimento desenha uma escada inteira a partir de um canto.',
    fonte: `programa {
  funcao escada(inteiro ox, inteiro oy, inteiro degraus, inteiro cor) {
    para (inteiro d = 0; d < degraus; d++) {
      para (inteiro k = 0; k < 3; k++) {
        pixel.ir_para(ox + d * 3 + k, oy + d * 3)
        pixel.pintar(cor)
      }
    }
  }
  funcao inicio() {
    escada(0, 0, 8, ${VERDE})
    escada(6, 0, 8, ${MAGENTA})
  }
}`,
    mutacoes: [['escada(6, 0, 8, ' + MAGENTA + ')', 'escada(0, 0, 8, ' + MAGENTA + ')']],
  },
  {
    categoria: 'procedimento', nome: 'Cor Calculada', tamanho: 32,
    dica: 'Uma funcao com retorno decide a cor de cada faixa.',
    fonte: `programa {
  funcao inteiro cor_da_faixa(inteiro y) {
    inteiro c = ${CIANO}
    se (y % 3 == 0) {
      c = ${VERDE}
    }
    retorne c
  }
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        pixel.ir_para(x, y)
        pixel.pintar(cor_da_faixa(y))
      }
    }
  }
}`,
    mutacoes: [['se (y % 3 == 0)', 'se (y % 2 == 0)']],
  },
  {
    categoria: 'procedimento', nome: 'Triangulo Reutilizavel', tamanho: 32,
    dica: 'O procedimento monta o triangulo linha por linha.',
    fonte: `programa {
  funcao triangulo(inteiro ox, inteiro oy, inteiro n, inteiro cor) {
    para (inteiro linha = 0; linha < n; linha++) {
      para (inteiro k = 0; k <= linha; k++) {
        pixel.ir_para(ox + k, oy + linha)
        pixel.pintar(cor)
      }
    }
  }
  funcao inicio() {
    triangulo(0, 0, 12, ${AMBAR})
    triangulo(18, 18, 12, ${MAGENTA})
  }
}`,
    mutacoes: [['k <= linha', 'k <= n']],
  },
  {
    categoria: 'procedimento', nome: 'Painel de Barras', tamanho: 32,
    dica: 'A altura da barra chega como parametro.',
    fonte: `programa {
  funcao barra(inteiro x, inteiro altura, inteiro cor) {
    para (inteiro k = 0; k < altura; k++) {
      pixel.ir_para(x, 31 - k)
      pixel.pintar(cor)
      pixel.ir_para(x + 1, 31 - k)
      pixel.pintar(cor)
    }
  }
  funcao inicio() {
    para (inteiro i = 0; i < 8; i++) {
      barra(i * 4, i * 4 + 2, ${VERDE})
    }
  }
}`,
    mutacoes: [['barra(i * 4, i * 4 + 2, ' + VERDE + ')', 'barra(i * 4, 4, ' + VERDE + ')']],
  },
  {
    categoria: 'procedimento', nome: 'Selo dos Quatro Cantos', tamanho: 32,
    dica: 'Um canto so, chamado quatro vezes com posicoes diferentes.',
    fonte: `programa {
  funcao canto(inteiro ox, inteiro oy, inteiro dx, inteiro dy, inteiro cor) {
    para (inteiro i = 0; i < 9; i++) {
      pixel.ir_para(ox + i * dx, oy)
      pixel.pintar(cor)
      pixel.ir_para(ox, oy + i * dy)
      pixel.pintar(cor)
    }
  }
  funcao inicio() {
    canto(0, 0, 1, 1, ${VERDE})
    canto(31, 0, -1, 1, ${VERDE})
    canto(0, 31, 1, -1, ${VERDE})
    canto(31, 31, -1, -1, ${VERDE})
  }
}`,
    mutacoes: [['canto(0, 31, 1, -1, ' + VERDE + ')', 'canto(0, 23, 1, -1, ' + VERDE + ')']],
  },
];
