const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importe o pacote CORS

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);

const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(cors()); // Use o middleware cors antes de suas rotas

app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
