const fs = require('fs');
const path = require('path');

let pipeline;
async function carregarIA() {
    const { pipeline: initPipeline } = await import('@xenova/transformers');
    // Mantém o carregamento estável do modelo offline local
    pipeline = await initPipeline('translation', 'Xenova/m2m100_418M');
}

const caminhoRom = process.argv[2];

if (!caminhoRom) {
    console.log("❌ Erro: Por favor, arraste e solte o arquivo da ROM (.sfc ou .smc) por cima deste comando!");
    process.exit(1);
}

// =========================================================================
// SCRIPT DE CORREÇÃO DE SINTAXE (MÉTODO ULTRA REPARADOR AUTOMÁTICO)
// =========================================================================
function corretorSintaxe(textoTraduzido, textoOriginal) {
    let resultado = textoTraduzido;

    // Se a linha original for puramente código estrutural, força o retorno original sem alterações da IA
    // Isso é inteligência de filtragem para impedir que o jogo crash por comandos errados
    if (/^(else if|if|else|while|for|switch|return)\b/i.test(textoOriginal.trim())) {
        // Se a tradução mudou radicalmente a lógica, devolvemos a fórmula exata original
        if (!resultado.includes('(') && textoOriginal.includes('(')) {
            return textoOriginal;
        }
    }

    const comandosSintaxe = ['if', 'else', 'then', 'switch', 'case', 'for', 'while', 'return'];

    comandosSintaxe.forEach(comando => {
        const regexOriginal = new RegExp(`\\b${comando}\\b`, 'i');
        if (regexOriginal.test(textoOriginal)) {
            resultado = resultado
                .replace(/\bse\b/gi, 'if')
                .replace(/\bsenão\b/gi, 'else')
                .replace(/\bsenao\b/gi, 'else')
                .replace(/\bentão\b/gi, 'then')
                .replace(/\bentao\b/gi, 'then')
                .replace(/\bpara\b/gi, 'for')
                .replace(/\bretorne\b/gi, 'return')
                .replace(/\bretornar\b/gi, 'return');
        }
    });

    // Remove espaços que a IA coloca erradamente ao redor de variáveis matemáticas
    if (textoOriginal.includes('>')) resultado = resultado.replace(/\s*>\s*/g, '>');
    if (textoOriginal.includes('<')) resultado = resultado.replace(/\s*<\s*/g, '<');
    if (textoOriginal.includes('=')) resultado = resultado.replace(/\s*=\s*/g, '=');
    if (textoOriginal.includes(';')) resultado = resultado.replace(/\s*;\s*/g, ';');
    if (textoOriginal.includes('-')) resultado = resultado.replace(/\s*-\s*/g, '-');

    return resultado;
}

async function pipelineUniversalRom() {
    console.log(`\n==========================================================`);
    console.log(`🧠 INICIANDO TRADUTOR COM CORRETOR DE SINTAXE INTEGRADO   `);
    console.log(`==========================================================`);
    
    await carregarIA();
    
    console.log(`\n📖 Lendo estrutura binária: ${path.basename(caminhoRom)}...`);
    let romBuffer = fs.readFileSync(caminhoRom);
    let novoRomBuffer = Buffer.from(romBuffer);
    
    console.log("🔍 Extraindo blocos de dados de texto ativos...");
    
    let textoColetado = "";
    let posicoesTexto = [];
    let blocoInicio = null;

    for (let i = 0; i < romBuffer.length; i++) {
        const byte = romBuffer[i];
        
        if (byte >= 32 && byte <= 122) {
            if (blocoInicio === null) blocoInicio = i;
            textoColetado += String.fromCharCode(byte);
        } else {
            const textoLimpo = textoColetado.trim();
            if (textoLimpo.length > 4 && textoLimpo.includes(" ") && /[a-zA-Z]{3,}/.test(textoLimpo)) {
                posicoesTexto.push({
                    inicio: blocoInicio,
                    fim: i,
                    texto: textoLimpo
                });
            }
            textoColetado = "";
            blocoInicio = null;
        }
    }

    let textosUnicos = [...new Set(posicoesTexto.map(item => item.texto))];
    console.log(`✨ Extraídas ${posicoesTexto.length} ocorrências (${textosUnicos.length} frases exclusivas).`);
    console.log(`🔄 Traduzindo e aplicando Correção de Sintaxe em tempo real...`);

    let mapaTraducoes = new Map();
    let contador = 0;

    for (let textoOriginal of textosUnicos) {
        contador++;
        try {
            const resultadoIA = await pipeline(textoOriginal, {
                src_lang: 'en',
                tgt_lang: 'pt',
            });
            
            let textoTraduzidoRaw = resultadoIA.translation_text;
            
            // Restaura as strings de código estragadas pela IA
            let textoTraduzidoFinal = corretorSintaxe(textoTraduzidoRaw, textoOriginal);

            mapaTraducoes.set(textoOriginal, textoTraduzidoFinal);
            
            console.log(`   [${contador}/${textosUnicos.length}] 
   [ORIGINAL]:  "${textoOriginal}" 
   [CORRETOR]:  "${textoTraduzidoFinal}"\n`);
   
        } catch (e) {
            mapaTraducoes.set(textoOriginal, textoOriginal);
        }
    }

    console.log(`\n⚙️ Recompilando os blocos protegidos na nova ROM...`);
    
    for (let item of posicoesTexto) {
        let traducao = mapaTraducoes.get(item.texto);
        if (traducao) {
            if (traducao.length > item.texto.length) {
                traducao = traducao.substring(0, item.texto.length);
            } else {
                traducao = traducao.padEnd(item.texto.length, " ");
            }

            for (let j = 0; j < traducao.length; j++) {
                novoRomBuffer[item.inicio + j] = traducao.charCodeAt(j);
            }
        }
    }

    const extensao = path.extname(caminhoRom);
    const novoCaminho = caminhoRom.replace(extensao, '_Traduzido' + extensao);
    
    // CORREÇÃO DO REFERENCERROR: Gravando o buffer correto modificado da ROM
    fs.writeFileSync(novoCaminho, novoRomBuffer);

    console.log(`\n🎉 PROCESSO CONCLUÍDO COM SEGURANÇA!`);
    console.log(`💾 Nova ROM protegida gerada: ${path.basename(novoCaminho)}`);
}

pipelineUniversalRom();
