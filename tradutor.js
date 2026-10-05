const fs = require('fs');
const path = require('path');

// Inicialização dinâmica do pipeline de IA offline do Hugging Face
let pipeline;
async function carregarIA() {
    const { pipeline: initPipeline } = await import('@xenova/transformers');
    // Carrega o modelo M2M100 otimizado para traduções diretas multilíngues
    pipeline = await initPipeline('translation', 'Xenova/m2m100_418M');
}

const caminhoRom = process.argv[2];

if (!caminhoRom) {
    console.log("❌ Erro: Por favor, arraste e solte o arquivo da ROM (.sfc ou .smc) por cima deste comando!");
    process.exit(1);
}

async function pipelineUniversalRom() {
    console.log(`\n==========================================================`);
    console.log(`🧠 CARREGANDO MOTOR DE IA NEURAL OFFLINE (HUGGING FACE)   `);
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
        
        // Captura strings que usem caracteres ASCII padrão de diálogos de jogos
        if (byte >= 32 && byte <= 122) {
            if (blocoInicio === null) blocoInicio = i;
            textoColetado += String.fromCharCode(byte);
        } else {
            const textoLimpo = textoColetado.trim();
            // Filtra ruídos brutos e mantém apenas frases prováveis (com espaços e letras seguidas)
            if (textoLimpo.length > 5 && textoLimpo.includes(" ") && /[a-zA-Z]{3,}/.test(textoLimpo)) {
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

    // Cria um mapa para não traduzir frases idênticas repetidas vezes
    let textosUnicos = [...new Set(posicoesTexto.map(item => item.texto))];
    console.log(`✨ Extraídas ${posicoesTexto.length} ocorrências (${textosUnicos.length} frases exclusivas).`);
    console.log(`🔄 Traduzindo via IA local (Sem usar internet / Sem risco de block)...`);

    let mapaTraducoes = new Map();
    let contador = 0;

    for (let textoOriginal of textosUnicos) {
        contador++;
        try {
            // Executa a tradução usando a inteligência artificial embarcada na sua máquina
            const resultadoIA = await pipeline(textoOriginal, {
                src_lang: 'en',
                tgt_lang: 'pt',
            });
            
            let textoTraduzido = resultadoIA[0].translation_text;
            mapaTraducoes.set(textoOriginal, textoTraduzido);
            
            console.log(`   [${contador}/${textosUnicos.length}] "${textoOriginal}" -> "${textoTraduzido}"`);
        } catch (e) {
            mapaTraducoes.set(textoOriginal, textoOriginal); // Se falhar, mantém original
        }
    }

    console.log(`\n⚙️ Compilando novos blocos binários para a nova ROM...`);
    
    // Injeta as traduções geradas de volta nos offsets corretos da ROM
    for (let item of posicoesTexto) {
        let traducao = mapaTraducoes.get(item.texto);
        if (traducao) {
            // Regra crucial: Alinha o tamanho do texto aos limites de ponteiros do SNES
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
    fs.writeFileSync(novoCaminho, novoRomBuffer);

    console.log(`\n🎉 PIPELINE CONCLUÍDO COM SUCESSO!`);
    console.log(`💾 Nova ROM universal gerada: ${path.basename(novoCaminho)}`);
}

pipelineUniversalRom();
