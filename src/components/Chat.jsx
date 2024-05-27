import React, { useState } from 'react';

const Chat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Simular um ID de usuário (substitua por lógica real)
    const userId = '12345';

    try {
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, userId }) // Enviar prompt e userId
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar a solicitação.');
      }

      const data = await response.json();
      setResponse(data.text);

      // Limpar campo de prompt após enviar
      setPrompt('');
    } catch (error) {
      setError('Erro ao processar a solicitação: ' + error.message);
    }
  };

  return (
    <div className="container">
      <h1>Interface de IA Generativa</h1>
      <div id="response-container">
        {error && <div className="error">{error}</div>}
        {response && <div className="response">{response}</div>}
      </div>
      <hr />
      <form onSubmit={handleSubmit}>
        <label htmlFor="prompt">Digite seu prompt:</label>
        <input
          type="text"
          id="prompt"
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <button type="submit">Enviar</button>
      </form>
      
    </div>
  );
};

export default Chat;
