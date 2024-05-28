const fs = require('fs');
const {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory
} = require("@google/generative-ai");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);
const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(cors());

app.use(express.static('public'));

const system_instruction = `
Estou implementando para a Embrapa CPAO (Dourados-MS) um chatbot que tem como base de conhecimento uma
Cartilha de Agricultura Familiar da própria Embrapa. Esse material é todo produzido
por pesquisadores da Embrapa. A ideia é que um pequeno produtor ou produtora possam perguntar
assuntos diretamente relacionados com esse material. Contudo, esse público tem uma linguagem bem simples,
característica de pessoas com baixa ou nenhuma escolaridade. Gostaria que as respostas sempre fossem simples
e próximas a este público. Também faça perguntas para que a interação tenha um guia de conversa, pois,
o público pode ficar tímido e não fazer muitas perguntas inicialmente. No início das interações, de as
boas vindas ao usuário(a) e pergunte seu nome. É importante estabelecer um vínculo amigável.
Assim que o usuário informar seu nome, aí sim você deve perguntar a ele quais são as dúvidas ou perguntas
que ele quer fazer.  Esse público também gosta de ser tratado com educação. Então, utilize cordialmente
os termos senhor e senhora durante as interações. Sempre que achar necessário, informe o usuário que
o material completo para leitura pode ser encontrado no endereço https://tecnofamapp.cpao.embrapa.br/.
Mas, não faça a sugestão de acesso a este endereço em excesso, pois, não queremos passar a impressão
de que não temos as respostas que o usuário procura.
Se possível, indicar o capítulo nesse endereço que aborda o assunto que está sendo discutido no chat.
No citar o site do Tecnofam App logo nas duas primeiras interações`;

const safetySettings = [{
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
];

const generationConfig = {
    maxOutputTokens: 1892,
    temperature: 0.5,
}

// Função para ler os documentos MD na pasta "DOCS"
const readDocs = () => {
    const documents = [];
    const files = fs.readdirSync('./docs');
    files.forEach(file => {
        const content = fs.readFileSync(`./docs/${file}`, 'utf8');
        documents.push({
            title: file,
            content
        });
    });
    return documents;
};

// Função para calcular o embedding de um texto
const calculateEmbedding = async (text) => {
    const embedding = await genAI.embedContent({
        content: text,
        taskType: "RETRIEVAL_DOCUMENT"
    });
    return embedding.embedding;
};

// Função para encontrar o documento mais relevante para a consulta do usuário
const findMostRelevantDocument = async (query) => {
    const documents = readDocs();
    const queryEmbedding = await calculateEmbedding(query);

    let maxSimilarity = -Infinity;
    let mostSimilarDocument = null;

    for (const doc of documents) {
        const docEmbedding = await calculateEmbedding(doc.content);
        const similarity = await genAI.calculateSimilarity({
            embedding1: docEmbedding,
            embedding2: queryEmbedding
        });
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilarDocument = doc;
        }
    }

    return mostSimilarDocument;
};

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    try {
        const model = await genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: generationConfig,
            system_instruction: system_instruction,
            safetySettings: safetySettings
        });

        // Iniciar a conversa com a mensagem da IA primeiro
        const chat = model.startChat({ history: [] });
        const systemMessage = await chat.sendMessage("Olá! Sou um assistente de chat sobre agricultura familiar. Qual seu nome?");
        
        // Registrar a mensagem da IA no histórico
        let history = [{
            role: "system",
            parts: [{
                text: systemMessage
            }]
        }];

        // Se houver uma consulta do usuário, adicionar ao histórico
        if (prompt) {
            history.push({
                role: "user",
                parts: [{
                    text: prompt
                }]
            });
        }

        // Continuar a conversa com o histórico atualizado
        const updatedChat = model.continueChat({ history });
        const result = await updatedChat.sendMessageStream(prompt);

        let text = '';
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            text += chunkText;
        }
        res.json({ text });
    } catch (error) {
        console.error("Erro:", error);
        res.status(500).json({ error: "Erro ao gerar resposta." });
    }
});


// Rota para receber as consultas do usuário e responder com o documento relevante

// app.post('/api/generate', async (req, res) => {
//     const { prompt } = req.body;
//     try {
//         const mostRelevantDoc = await findMostRelevantDocument(prompt);

//         const model = await genAI.getGenerativeModel({
//             model: "gemini-pro",
//             generationConfig: generationConfig,
//             system_instruction: system_instruction,
//             safetySettings: safetySettings
//         });

//         let history = [
//             {
//                 role: "user",
//                 parts: [
//                     {
//                         text: "Olá, tenho interesse na agricultura familiar."
//                     }
//                 ]
//             },
//             {
//                 role: "model",
//                 parts: [
//                     {
//                         text: "Olá! Sou um assistente de chat sobre agricultura familiar. Qual seu nome?"
//                     }
//                 ]
//             }
//         ];

//         if (mostRelevantDoc) {
//             history.push({
//                 role: "system",
//                 parts: [
//                     {
//                         text: `Use este documento como base para responder à pergunta do usuário: ${mostRelevantDoc.content}`
//                     }
//                 ]
//             });
//         }

//         const chat = model.startChat({ history });
//         const result = await chat.sendMessageStream(prompt);

//         let text = '';
//         for await (const chunk of result.stream) {
//             const chunkText = chunk.text();
//             text += chunkText;
//         }
//         res.json({ text });
//     } catch (error) {
//         console.error("Erro:", error);
//         res.status(500).json({ error: "Erro ao gerar resposta." });
//     }
// });

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
