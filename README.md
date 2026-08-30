# Do Código ao Pixel

Aplicação web de treino de lógica de programação. O aluno escreve um programa
que controla um cursor sobre um grid e precisa reproduzir um quadro em pixel
art antes de o cronômetro acabar. Quanto mais rápido, mais completo e mais
enxuto o programa, maior a pontuação.

A interface é o sistema de treinamento de cadetes da nave-escola Orion-9:
tecnologia humana dos anos 1990 misturada com fragmentos de uma tecnologia
alienígena que ninguém a bordo terminou de decifrar.

**Aplicação no ar:** https://gaburadigital.github.io/do-codigo-ao-pixel/

---

## Sumário

- [O que a aplicação faz](#o-que-a-aplicação-faz)
- [Como jogar](#como-jogar)
- [Pontuação](#pontuação)
- [Como atualizar o conteúdo](#como-atualizar-o-conteúdo)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Formato de uma arte](#formato-de-uma-arte)
- [Ferramentas](#ferramentas)
- [Rodar na sua máquina](#rodar-na-sua-máquina)
- [Publicar uma atualização](#publicar-uma-atualização)
- [Instalar como aplicativo](#instalar-como-aplicativo)
- [Compatibilidade](#compatibilidade)
- [Acessibilidade e privacidade](#acessibilidade-e-privacidade)
- [Roteiro](#roteiro)
- [Licença](#licença)

---

## O que a aplicação faz

| Recurso | Situação |
|---|---|
| Modo Lógica Básica (artes sorteadas por assunto) | pronto |
| Modo Desenho Livre (grid limpo, exporta PNG) | pronto |
| Programação em blocos (Blockly com aparência do Scratch 3) | pronto |
| Programação em Portugol | próxima atualização |
| Modo Tutorial de Lógica (código com erros para corrigir) | próxima atualização |
| Modo Desafio com Arte Importada | próxima atualização |
| Cronômetro com pausa, reinício e tempo infinito | pronto |
| Três resoluções: 32x32, 64x64 e 128x128 | pronto |
| Relatório em PNG com nome do aluno | pronto |
| Instalação como aplicativo (PWA) e uso offline | pronto |
| Avisos sonoros gerados no navegador | pronto |
| Modo claro, desligar som, salvar e limpar preferências | pronto |
| Patentes, insígnias e glifos colecionáveis | pronto |

A aplicação não usa nenhum serviço externo. Nada é enviado para servidor
nenhum: as preferências e o progresso ficam apenas no navegador do aluno.

---

## Como jogar

1. Na tela inicial, escolha o modo, a resolução, o assunto que quer treinar e
   o tempo de treino.
2. Ao começar, a tela se divide: à esquerda o terminal de programação, à
   direita o grid com a arte de referência aparecendo por transparência.
3. Monte o programa com os blocos e clique em **Executar**. O cursor percorre o
   grid e pinta.
4. O medidor de conclusão mostra quanto da arte foi reproduzido corretamente.
   - Com **75% ou mais**, o botão **Passar arte** libera.
   - Ao chegar a **100%**, a arte é concluída sozinha e vale o dobro de pontos.
5. A cada arte concluída ou passada, o programa é apagado e uma arte nova é
   sorteada.
6. Quando o tempo acaba, ou ao clicar em **Parar**, aparece o relatório com a
   pontuação e o botão de exportar.

**Regras do cursor.** Ele sempre começa em `x = 0`, `y = 0`, no canto superior
esquerdo. Em `x`, o valor `1` anda para a direita e `-1` para a esquerda. Em
`y`, `1` sobe e `-1` desce.

**Erros interrompem tudo.** Se o cursor tentar sair do grid, ou se o programa
passar de 300 mil comandos (sinal de repetição sem fim), a execução para com
um aviso e o grid não é alterado. Programa com erro nunca desenha pela metade.

Atalho: `Ctrl + Enter` (ou `Cmd + Enter`) executa o programa.

---

## Pontuação

```
pontos = base × completude × tempo × eficiência − penalidade
```

| Fator | Valor |
|---|---|
| Base | 100 no 32x32, 250 no 64x64, 500 no 128x128 |
| Completude | 2,0 ao concluir 100%; 1,0 ao passar com 75% ou mais |
| Tempo | de 1,5 (rápido) a 0,8 (lento), conforme um tempo de referência por resolução |
| Eficiência | 1,5 se o programa couber no tamanho ideal; 1,0 até o dobro; 0,6 acima disso |
| Penalidade | 5 pontos por pixel pintado com a cor errada |

O tamanho ideal de cada arte fica no campo `par` do arquivo da arte. É por
causa desse fator que resolver na força bruta rende menos: um programa de 900
blocos e um de 8 blocos produzem o mesmo desenho, mas não a mesma nota.

A **Eficiência de Transmissão**, mostrada na barra superior, é a mesma métrica
apresentada como porcentagem, para o aluno perceber o efeito enquanto programa.

---

## Como atualizar o conteúdo

Este é o fluxo normal do dia a dia.

1. Coloque os arquivos `.json` das artes novas dentro da pasta do nível
   correspondente, em `ATIVIDADES/nivel-32`, `ATIVIDADES/nivel-64` ou
   `ATIVIDADES/nivel-128`.
2. Rode o comando abaixo. Ele varre as pastas, lê os dados de dentro de cada
   arquivo e reescreve o `catalogo.json` inteiro.

```bash
node ferramentas/atualizar-catalogo.mjs
```

3. Suba as alterações para o GitHub.

Você **não precisa editar o `catalogo.json` na mão**. Ele é gerado. O comando
também avisa se algum arquivo estiver com JSON inválido ou faltando campos.

O nome do arquivo define a ordem e serve de identificador. O nome que aparece
na interface vem do campo `nome` de dentro do arquivo, que pode ter acentos e
espaços à vontade.

> **Sem o Node instalado?** Dá para adicionar artes editando o `catalogo.json`
> direto pelo site do GitHub: basta acrescentar `{ "arquivo": "...", "nome": "..." }`
> na lista da categoria certa. O comando acima só automatiza esse passo.

---

## Estrutura do repositório

```
do-codigo-ao-pixel/
├── index.html                  a aplicação
├── manifest.webmanifest        dados de instalação do PWA
├── sw.js                       service worker (offline e cache)
├── catalogo.json               índice das artes — gerado por ferramenta
├── ATIVIDADES/                 todo o conteúdo dos exercícios
│   ├── nivel-32/               150 artes 32x32
│   ├── nivel-64/               150 artes 64x64
│   ├── nivel-128/              150 artes 128x128
│   └── tutorial/               artes do modo Tutorial (próxima atualização)
│       ├── repeticao/
│       ├── condicao/
│       └── procedimento/
├── assets/icones/              favicon e ícones do PWA
├── css/
│   ├── base.css                cores, tipografia, temas claro e escuro
│   ├── terminal.css            janelas, botões, campos, selos
│   └── layout.css              estrutura, divisão de painéis, responsividade
├── js/
│   ├── app.js                  controlador principal
│   ├── nucleo/                 estado, catálogo, cronômetro, pontuação
│   ├── grid/                   modelo do grid e desenho no canvas
│   ├── exec/                   biblioteca pixel, executor, animação
│   ├── blocos/                 blocos do Blockly e geradores de código
│   ├── modos/                  descrição de cada modo de treino
│   └── ui/                     ícones, som, boot, NOVA-7, ajustes, relatório
├── ferramentas/                scripts de manutenção (rodam no Node)
└── vendor/blockly/             Blockly embutido, para funcionar offline
```

Cada arquivo tem uma responsabilidade só. Para mexer nas cores, `css/base.css`.
Para mexer na fórmula de pontos, `js/nucleo/pontuacao.js`. Para mexer nas falas
da IA de bordo, `js/ui/nova.js`. Para acrescentar um bloco novo,
`js/blocos/definicoes.js` e depois a barra de ferramentas em
`js/blocos/oficina.js`.

---

## Formato de uma arte

Cada arte é um JSON pequeno, com a paleta separada dos pixels e os pixels
comprimidos em RLE (`índice x repetições`). Uma arte típica ocupa 2 KB.

```json
{
  "id": "rep-001",
  "nome": "Listras Horizontais",
  "categoria": "repeticao",
  "largura": 32,
  "altura": 32,
  "par": 8,
  "dica": "Uma repetição que pula de 4 em 4 linhas resolve tudo.",
  "paleta": ["transparente", "#3BFF9E", "#1F9E63"],
  "pintados": 256,
  "pixels": "1x32,0x96,2x32,0x96"
}
```

| Campo | Para que serve |
|---|---|
| `nome` | o que aparece na interface |
| `categoria` | `repeticao`, `condicao` ou `procedimento`; define em qual foco a arte é sorteada |
| `par` | tamanho de código de referência; alimenta a Eficiência de Transmissão |
| `dica` | frase mostrada abaixo do grid |
| `paleta` | índice 0 é sempre `"transparente"` |
| `pixels` | pares `índice x quantidade`, lidos linha a linha, da esquerda para a direita |
| `manual` | opcional; se `true`, o gerador de catálogo não recalcula nada desse arquivo |

---

## Ferramentas

Todas rodam com o Node e não precisam de nenhuma dependência instalada, com
exceção do teste de blocos.

```bash
# Reescreve o catalogo.json a partir das pastas (uso do dia a dia)
node ferramentas/atualizar-catalogo.mjs

# Gera artes novas por geração procedural
node ferramentas/gerar-artes.mjs --por-categoria 50
node ferramentas/gerar-artes.mjs --niveis 64 --por-categoria 20
node ferramentas/gerar-artes.mjs --limpar          # apaga as antigas antes

# Regera os PNG do PWA a partir da definição do favicon
node ferramentas/gerar-icones.mjs

# Verifica o motor: reproduz todas as artes e testa os erros de execução
node ferramentas/testar-motor.mjs

# Verifica os blocos (precisa de: npm install blockly)
node ferramentas/testar-blocos.mjs
```

O gerador de artes tem 41 receitas divididas por assunto. Para criar receitas
novas, acrescente uma entrada em `RECEITAS` dentro de
`ferramentas/gerar-artes.mjs`: cada receita recebe uma tela e devolve nome,
`par` e dica.

---

## Rodar na sua máquina

A aplicação usa módulos JavaScript, então precisa de um servidor. Abrir o
`index.html` com dois cliques não funciona.

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

---

## Publicar uma atualização

1. Suba os arquivos para o branch principal.
2. Em **Settings → Pages**, deixe a origem em **Deploy from a branch**,
   branch `main`, pasta `/ (root)`.
3. **Importante:** ao publicar mudanças em CSS ou JavaScript, altere o número
   da constante `VERSAO` no topo do `sw.js`. É isso que descarta o cache antigo
   e entrega os arquivos novos aos alunos que já usaram o site.

Artes e `catalogo.json` não precisam disso: o service worker busca esses
arquivos pela rede primeiro e só usa o cache quando não há conexão.

---

## Instalar como aplicativo

- **Chrome, Edge, Android:** ícone de instalar na barra de endereço, ou menu
  → Instalar aplicativo.
- **Safari no iPhone e iPad:** botão Compartilhar → Adicionar à Tela de Início.

Depois de instalada, a aplicação abre em janela própria e funciona sem
internet. As artes já visitadas ficam guardadas.

---

## Compatibilidade

Construída para Chrome e Safari em computador, tablet e celular. O layout dá
prioridade à tela em paisagem no computador, com os dois painéis lado a lado e
divisória arrastável. Em telas estreitas, os painéis viram abas e um espelho do
grid fica flutuando enquanto o aluno programa.

Nada de dependência externa em tempo de execução: sem CDN, sem fontes de rede,
sem rastreadores. O Blockly está embutido em `vendor/`.

---

## Acessibilidade e privacidade

- Navegação por teclado em toda a interface, com foco visível.
- Rótulos em português para leitores de tela.
- A animação de varredura pode ser desligada, e a aplicação respeita a
  preferência do sistema por menos movimento.
- Modo claro disponível nos ajustes.
- Nenhum dado sai do navegador. Os ajustes ficam em `localStorage` e podem ser
  apagados pelo botão **Limpar dados salvos**.
- Nenhum emoji na interface: todos os ícones são SVG desenhados no projeto.

---

## Roteiro

**Fase 2**

- Editor em Portugol, com interpretador próprio e documentação da biblioteca
  `pixel` dentro da aplicação.
- Modo Tutorial de Lógica: código pela metade, com erros plantados, e botão de
  mostrar a resposta (que zera os pontos da arte).
- Modo Desafio com Arte Importada: envio de imagens do próprio aluno, com
  redimensionamento por vizinho mais próximo e redução para até 16 cores.

---

## Licença

MIT.

---

criado por **GABURA** — estude, aprenda e compartilhe mais exercícios em
https://sites.google.com/view/links-gabura
