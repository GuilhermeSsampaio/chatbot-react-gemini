const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();


const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_VIOLENCE,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_ILLEGAL,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

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
  que ele quer fazer. Esse público também gosta de ser tratado com educação. Então, utilize cordialmente
  os termos senhor e senhora durante as interações. Sempre que achar necessário, informe o usuário que
  o material completo para leitura pode ser encontrado no endereço https://tecnofamapp.cpao.embrapa.br/.
  Mas, não faça a sugestão de acesso a este endereço em excesso, pois, não queremos passar a impressão
  de que não temos as respostas que o usuário procura.
  Se possível, indicar o capítulo nesse endereço que aborda o assunto que está sendo discutido no chat.
  No citar o site do Tecnofam App logo nas duas primeiras interações
`;

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
    const result = await model.generateContent(prompt, { system_instruction, safetySettings });
    // const result = await model.generateContent(prompt);
    const response = await result.response;
    // const text = result.data[0].text;
    const text = await response.text();

    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
