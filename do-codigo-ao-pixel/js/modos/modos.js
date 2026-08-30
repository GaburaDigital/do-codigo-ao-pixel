/* =========================================================================
   modos.js — Descricao de cada modo de treino.
   Adicionar um modo novo e adicionar uma entrada aqui e um arquivo proprio
   quando ele precisar de comportamento especial.
   ========================================================================= */

export const MODOS = {
  'logica-basica': {
    id: 'logica-basica',
    rotulo: 'Logica Basica',
    comAlvo: true,
    comCronometro: true,
    comPontos: true,
    podePassar: true,
    podeBaixar: false,
    usaFoco: true,
    permiteInfinito: true,
  },
  livre: {
    id: 'livre',
    rotulo: 'Desenho Livre',
    comAlvo: false,
    comCronometro: false,
    comPontos: false,
    podePassar: false,
    podeBaixar: true,
    usaFoco: false,
    permiteInfinito: false,
  },
  tutorial: {
    id: 'tutorial',
    rotulo: 'Tutorial de Logica',
    comAlvo: true,
    comCronometro: true,
    comPontos: true,
    podePassar: true,
    podeBaixar: false,
    usaFoco: true,
    permiteInfinito: true,
    codigoPronto: true,     // o programa ja vem montado, com erros
    temResposta: true,      // existe o botao de mostrar a solucao
  },
  importada: {
    id: 'importada',
    rotulo: 'Arte Importada',
    comAlvo: true,
    comCronometro: true,
    comPontos: true,
    podePassar: true,
    podeBaixar: true,
    usaFoco: false,
    permiteInfinito: true,
    precisaImagens: true,
  },
};

export function modo(id) {
  return MODOS[id] || MODOS['logica-basica'];
}
