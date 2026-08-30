/* =========================================================================
   documentacao.js — Conteudo do botao de documentacao do editor Portugol.
   ========================================================================= */

export const MODELO_INICIAL =
`programa {

  funcao inicio() {
    // O cursor comeca em x = 0, y = 0.
    // Escreva seu programa aqui.

  }

}
`;

const BIBLIOTECA = [
  ['Movimento', [
    ['pixel.mover_x(inteiro passos)', 'Anda na horizontal. 1 vai para a direita, -1 para a esquerda.'],
    ['pixel.mover_y(inteiro passos)', 'Anda na vertical. 1 sobe, -1 desce.'],
    ['pixel.ir_para(inteiro x, inteiro y)', 'Salta direto para uma posicao.'],
    ['pixel.ir_para_x(inteiro x)', 'Muda so a coluna.'],
    ['pixel.ir_para_y(inteiro y)', 'Muda so a linha.'],
    ['pixel.posicao_x()', 'Devolve a coluna atual do cursor.'],
    ['pixel.posicao_y()', 'Devolve a linha atual do cursor.'],
    ['pixel.largura()', 'Largura do grid. Use para o mesmo codigo servir em 32, 64 e 128.'],
    ['pixel.altura()', 'Altura do grid.'],
  ]],
  ['Pintura', [
    ['pixel.pintar(inteiro cor)', 'Pinta o pixel onde o cursor esta.'],
    ['pixel.pintar(inteiro r, inteiro g, inteiro b)', 'Mesma coisa, passando os tres valores direto.'],
    ['pixel.apagar()', 'Deixa o pixel transparente de novo.'],
    ['pixel.cor_em(inteiro x, inteiro y)', 'Devolve a cor que voce pintou naquela posicao, ou -1 se estiver vazia.'],
  ]],
  ['Cores', [
    ['pixel.cor(inteiro r, inteiro g, inteiro b)', 'Monta uma cor a partir de tres valores de 0 a 255.'],
    ['pixel.vermelho(inteiro cor)', 'Extrai o vermelho de uma cor.'],
    ['pixel.verde(inteiro cor)', 'Extrai o verde de uma cor.'],
    ['pixel.azul(inteiro cor)', 'Extrai o azul de uma cor.'],
    ['pixel.vazio(inteiro cor)', 'Verdadeiro quando o pixel ainda nao foi pintado.'],
    ['pixel.iguais(inteiro a, inteiro b)', 'Compara duas cores.'],
  ]],
  ['Matematica', [
    ['matematica.abs(x)', 'Valor absoluto, sem sinal.'],
    ['matematica.raiz(x)', 'Raiz quadrada.'],
    ['matematica.potencia(x, y)', 'x elevado a y.'],
    ['matematica.piso(x)', 'Arredonda para baixo.'],
    ['matematica.teto(x)', 'Arredonda para cima.'],
    ['matematica.arredondar(x)', 'Arredonda para o inteiro mais proximo.'],
    ['matematica.maximo(a, b)', 'O maior dos dois.'],
    ['matematica.minimo(a, b)', 'O menor dos dois.'],
  ]],
];

const LINGUAGEM = [
  ['Estrutura', `programa {
  funcao inicio() {
    // por onde tudo comeca
  }
}`],
  ['Variaveis', `inteiro x = 0
real media = 1.5
logico ligado = verdadeiro
cadeia nome = "cadete"
inteiro v[10]`],
  ['Repeticao para', `para (inteiro i = 0; i < 32; i++) {
  pixel.pintar(pixel.cor(59, 255, 158))
  pixel.mover_x(1)
}`],
  ['Repeticao enquanto', `inteiro x = 0
enquanto (x < 32) {
  pixel.ir_para(x, 0)
  pixel.pintar(pixel.cor(255, 215, 94))
  x++
}`],
  ['Condicao', `se ((x + y) % 2 == 0) {
  pixel.pintar(pixel.cor(59, 255, 158))
} senao {
  pixel.pintar(pixel.cor(77, 225, 255))
}`],
  ['Procedimento', `funcao desenhar_linha(inteiro y, inteiro cor) {
  para (inteiro x = 0; x < pixel.largura(); x++) {
    pixel.ir_para(x, y)
    pixel.pintar(cor)
  }
}`],
  ['Funcao com retorno', `funcao inteiro dobro(inteiro n) {
  retorne n * 2
}`],
  ['Operadores', `+  -  *  /  %        contas
==  !=  <  >  <=  >=  comparacoes
e   ou   nao          logica`],
];

export function montarDocumentacao() {
  const bloco = (titulo, conteudo) =>
    '<div><div class="legenda" style="margin-bottom:6px">' + titulo + '</div>' + conteudo + '</div>';

  const tabelas = BIBLIOTECA.map(([grupo, itens]) => bloco(grupo,
    '<table style="width:100%;border-collapse:collapse" class="texto-peq">' +
    itens.map(([assinatura, descricao]) =>
      '<tr>' +
      '<td style="padding:3px 10px 3px 0;color:var(--verde);white-space:nowrap;vertical-align:top">' +
      assinatura + '</td>' +
      '<td style="padding:3px 0;color:var(--texto-suave)">' + descricao + '</td></tr>'
    ).join('') + '</table>'
  )).join('<hr class="divisor">');

  const exemplos = LINGUAGEM.map(([titulo, codigo]) => bloco(titulo,
    '<pre class="texto-peq" style="margin:0;padding:10px;background:var(--painel-fundo);' +
    'border:1px solid var(--linha);overflow:auto;white-space:pre">' + escapar(codigo) + '</pre>'
  )).join('');

  return (
    '<p class="texto-peq texto-suave">' +
    'A biblioteca <span class="texto-verde">pixel</span> controla o cursor e a pintura do grid. ' +
    'O ponto e virgula no fim das linhas e opcional.' +
    '</p><hr class="divisor">' +
    '<div class="legenda" style="margin-bottom:8px">Biblioteca pixel</div>' +
    tabelas +
    '<hr class="divisor">' +
    '<div class="legenda" style="margin-bottom:8px">A linguagem</div>' +
    '<div class="pilha">' + exemplos + '</div>'
  );
}

function escapar(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
