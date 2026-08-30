/*
  testar-portugol.mjs — Verifica o interpretador de Portugol: desenho,
  procedimentos, condicoes, vetores, limites e mensagens de erro.

  Uso: node ferramentas/testar-portugol.mjs
*/

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), '..') + '/';
const {prepararArte, arteVazia}=await import(R+'js/nucleo/catalogo.js');
const {ModeloGrid}=await import(R+'js/grid/modelo.js');
const {Runtime}=await import(R+'js/exec/api-pixel.js');
const {interpretar}=await import(R+'js/portugol/interpretador.js');
const m=new ModeloGrid(arteVazia(32));
function run(src){ const P=new Runtime(m,{}); P.comecar(); const r=interpretar(src,P); return {r,P}; }

let f=0; const ok=(t,c,d='')=>{if(!c)f++;console.log((c?'  ok  ':' FALHA')+'  '+t+(d?'   ('+d+')':''));};

let {r}=run(`programa {
  funcao inicio() {
    para (inteiro i = 0; i < 32; i++) {
      pixel.ir_para(i, i)
      pixel.pintar(pixel.cor(59, 255, 158))
    }
  }
}`);
ok('para + pixel.pintar', r.ok, r.erro||'');
let pintados=0; for(const v of m.pintado) if(v!==-1) pintados++;
ok('pintou 32 pixels na diagonal', pintados===32, 'pintou '+pintados);
ok('conta instrucoes', r.instrucoes>0, 'instrucoes: '+r.instrucoes);

({r}=run(`programa {
  funcao desenhar_linha(inteiro y, inteiro c) {
    para (inteiro x = 0; x < pixel.largura(); x++) {
      pixel.ir_para(x, y)
      pixel.pintar(c)
    }
  }
  funcao inicio() {
    inteiro verde = pixel.cor(59, 255, 158)
    para (inteiro y = 0; y < pixel.altura(); y += 4) {
      desenhar_linha(y, verde)
    }
  }
}`));
ok('procedimento com parametros', r.ok, r.erro||'');
pintados=0; for(const v of m.pintado) if(v!==-1) pintados++;
ok('8 linhas de 32 pixels', pintados===256, 'pintou '+pintados);

({r}=run(`programa {
  funcao inicio() {
    para (inteiro y = 0; y < 32; y++) {
      para (inteiro x = 0; x < 32; x++) {
        se ((x + y) % 2 == 0) {
          pixel.ir_para(x, y)
          pixel.pintar(pixel.cor(255, 215, 94))
        }
      }
    }
  }
}`));
ok('condicao com resto de divisao', r.ok, r.erro||'');
pintados=0; for(const v of m.pintado) if(v!==-1) pintados++;
ok('xadrez com 512 pixels', pintados===512, 'pintou '+pintados);

({r}=run(`programa { funcao inicio() { pixel.ir_para(0,0) pixel.mover_x(50) } }`));
ok('cursor fora do grid barrado', !r.ok && r.tipo==='limite-grid', r.erro);

({r}=run(`programa { funcao inicio() { enquanto (verdadeiro) { } } }`));
ok('loop infinito barrado', !r.ok && r.tipo==='limite');

({r}=run(`programa { funcao inicio() { inteiro x = }`));
ok('erro de sintaxe reportado com linha', !r.ok && r.tipo==='sintaxe', r.erro);

({r}=run(`programa { funcao inicio() { pixel.pintar_tudo(1) } }`));
ok('comando inexistente da mensagem util', !r.ok, r.erro);

({r}=run(`programa { funcao inicio() { inteiro v[5] v[2] = 7 se (v[2] != 7) { pixel.mover_x(99) } } }`));
ok('vetores funcionam', r.ok, r.erro||'');

({r}=run(`funcao inicio() { }`));
ok('exige o bloco programa', !r.ok && r.tipo==='sintaxe', r.erro);

({r}=run(`programa { funcao inicio() { inteiro c = pixel.cor_em(0,0) se (pixel.vazio(c)) { pixel.pintar(pixel.cor(1,2,3)) } } }`));
ok('leitura de cor e teste de vazio', r.ok, r.erro||'');

console.log(f? f+' falhas':'Todas as verificacoes passaram.');
process.exit(f?1:0);
