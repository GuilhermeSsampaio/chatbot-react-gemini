const { GoogleGenerativeAI } = require("@google/generative-ai");
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

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    try {
        const model = await genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Olá, tenho interesse na agricultura familiar." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Olá! Sou um assistente de chat sobre agricultura familiar. Como posso ajudar você hoje?" }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 100,
            },
        });
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        res.json({ text });
    } catch (error) {
        console.error("Erro:", error);
        res.status(500).json({ error: "Erro ao gerar resposta." });
    }
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
