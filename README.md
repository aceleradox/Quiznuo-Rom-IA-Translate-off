# 🎮 Tradutor Universal de ROMs de SNES (IA Offline)

Este é um pipeline automatizado em **Node.js** desenvolvido para extrair, traduzir e recompilar blocos de texto diretamente nos arquivos binários de ROMs do Super Nintendo (`.sfc` ou `.smc`). 

O diferencial deste projeto é o uso de **Inteligência Artificial Neural 100% Offline** (através do modelo Meta M2M100 via Hugging Face Transformers). Isso elimina a necessidade de chaves de API pagas e evita bloqueios de IP causados por requisições em massa em servidores públicos (como Google Tradutor).

---

## ✨ Funcionalidades

- **Universal:** Funciona com qualquer jogo de SNES que armazene textos em formato ASCII padrão.
- **100% Offline:** O modelo roda direto no seu processador, sem chamadas externas de internet.
- **Otimizado:** Identifica strings duplicadas na ROM para traduzir o termo apenas uma vez, acelerando o processo.
- **Seguro contra Bugs:** Respeita rigorosamente o tamanho dos ponteiros originais do SNES, preenchendo espaços vazios com bytes nulos para evitar corromper o jogo.
- **Fácil de Usar:** Suporta o sistema "arrastar e soltar" do Windows direto no terminal.

---

## 🛠️ Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
1. [Node.js](https://nodejs.org) (Versão 18 ou superior recomendada).

---

## 📦 Instalação

1. Crie uma pasta para o seu projeto e acesse-a pelo terminal:
   ```bash
   mkdir snes-rom-translator
   cd snes-rom-translator
   ```

2. Inicialize o projeto Node.js:
   ```bash
   npm init -y
   ```

3. Instale a biblioteca de IA e manipulação de modelos neurais do Hugging Face:
   ```bash
   npm install @xenova/transformers
   ```

4. Crie o arquivo `tradutor.js` na pasta e cole o código do script correspondente.

---

## 🚀 Como Usar

> ⚠️ **IMPORTANTE:** O script não aceita arquivos compactados em `.zip`. Você deve **extrair a ROM** primeiro para obter o arquivo `.sfc` ou `.smc`.

1. Abra o seu **Prompt de Comando (CMD)** ou o terminal do VS Code na pasta do projeto.
2. Digite o comando abaixo inserindo um espaço ao final:
   ```bash
   node tradutor.js 
   ```
3. **Arraste e solte** o arquivo da sua ROM descompactada (Ex: `Secret of Evermore (USA).sfc`) de dentro da sua pasta direto para a janela do terminal. O Windows preencherá o caminho do arquivo automaticamente.
4. Aperte **Enter**.

### ℹ️ O que esperar na primeira execução?
Na primeira vez que você rodar o script, o Node.js fará o download do modelo de tradução leve `Xenova/m2m100_418M` (cerca de algumas centenas de megabytes). Mensagens com o prefixo `[W:onnxruntime:...]` aparecerão na tela — **isso é normal**, trata-se da IA otimizando o uso da memória RAM do seu computador.

Nas execuções seguintes, o script iniciará instantaneamente de forma 100% offline.

---

## 💾 Arquivo de Saída

Assim que o processamento terminar, o script compilará os novos bytes de texto direto na estrutura do arquivo e gerará uma nova ROM na mesma pasta, nomeada com o sufixo **`_Traduzido`** (Ex: `Secret of Evermore (USA)_Traduzido.sfc`). 

Basta abrir esse arquivo novo diretamente no seu emulador (como o BizHawk) ou console portátil para jogar o game em português!
