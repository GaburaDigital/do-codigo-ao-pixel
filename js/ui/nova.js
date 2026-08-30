/* =========================================================================
   nova.js — NOVA-7, a IA de bordo. Comenta o que o aluno acabou de fazer.
   O humor e seco, nunca ofensivo, e sempre aponta o proximo passo util.
   ========================================================================= */

const FALAS = {
  boasVindas: [
    'Cadete a bordo. Escreva um programa e eu transmito para o painel.',
    'Sistema pronto. O cursor comeca em x igual a zero, y igual a zero. Sempre.',
    'Lembrete institucional: repeticoes gastam menos combustivel que paciencia.',
  ],
  primeiraExecucao: [
    'Transmissao recebida. Vamos ver o que sai disso.',
    'Executando. Prometo nao julgar. Muito.',
  ],
  muitosBlocos: [
    'Detectei {n} blocos para um desenho que cabia em bem menos. Isto e uma escolha.',
    'Seu programa tem {n} blocos. O manual sugere {par}. O manual costuma estar certo.',
    'Contei {n} blocos. Uma repeticao bem colocada aposentaria uns quantos.',
  ],
  eficiente: [
    'Codigo enxuto. A sala de maquinas agradece.',
    'Eficiencia de transmissao alta. Isto sim e engenharia.',
    '{n} blocos. Elegante. Anotei no seu registro.',
  ],
  progressoBaixo: [
    'Preenchimento em {p} por cento. O quadro ainda esta com saudade de tinta.',
    '{p} por cento. Comeco e comeco.',
  ],
  progressoMedio: [
    '{p} por cento. Da para avancar, mas cem por cento vale o dobro de pontos.',
    'Metade do caminho. A outra metade costuma ser a mesma repeticao com outro numero.',
  ],
  progressoAlto: [
    '{p} por cento. Falta pouco. Nao me decepcione agora.',
    'Quase la. O ultimo pixel e sempre o mais teimoso.',
  ],
  completo: [
    'Arte completa. Registro atualizado. Sensacao de orgulho: simulada, mas presente.',
    'Cem por cento. A frota inteira viu isso.',
    'Transmissao perfeita. Nenhum pixel fora do lugar.',
  ],
  comErro: [
    'Encontrei {e} pixels com a cor errada. Eles estao marcados com um X.',
    '{e} pixels divergentes. Confira a paleta antes de pintar.',
  ],
  erroLimite: [
    'Interrompi a transmissao. Um programa que nunca termina tambem nunca desenha.',
    'Parada de emergencia. Alguma repeticao esqueceu de acabar.',
  ],
  erroGrid: [
    'O cursor tentou sair do casco. Isto nao e permitido, nem recomendavel.',
    'Fora dos limites do grid. O espaco la fora e bonito, mas vazio.',
  ],
  vazio: [
    'Nenhum bloco conectado. Estou transmitindo silencio.',
    'Programa vazio. Ate eu preciso de instrucoes.',
  ],
  passou: [
    'Arte arquivada em {p} por cento. Proxima transmissao chegando.',
    'Avancando. Quem completa cem por cento leva o dobro, so lembrando.',
  ],
  tempoAcabando: [
    'Um minuto restante. Sem pressa, mas com pressa.',
    'Reservas de tempo em nivel critico.',
  ],
  glifo: [
    'Decodifiquei um glifo novo: {g}. Guardei na tabela de traducao.',
    'Fragmento alienigena decifrado. Significado provavel: {g}.',
  ],
};

let ultimo = '';

function sortear(lista) {
  if (lista.length === 1) return lista[0];
  let escolha = lista[Math.floor(Math.random() * lista.length)];
  let tentativas = 0;
  while (escolha === ultimo && tentativas++ < 4) {
    escolha = lista[Math.floor(Math.random() * lista.length)];
  }
  ultimo = escolha;
  return escolha;
}

export function falaDe(chave, dados = {}) {
  const lista = FALAS[chave];
  if (!lista) return '';
  let texto = sortear(lista);
  for (const [k, v] of Object.entries(dados)) {
    texto = texto.replaceAll('{' + k + '}', String(v));
  }
  return texto;
}

let elemento = null;

export function ligarNova(el) {
  elemento = el;
}

export function nova(chave, dados = {}) {
  if (!elemento) return;
  const texto = falaDe(chave, dados);
  if (!texto) return;
  elemento.innerHTML = '<b>NOVA-7:</b> ' + texto;
}

export function novaLivre(texto) {
  if (!elemento) return;
  elemento.innerHTML = '<b>NOVA-7:</b> ' + texto;
}
