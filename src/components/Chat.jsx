import React, { useState } from 'react';

const Chat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      setResponse(data.text);
    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  return (
    <div className="container">
      <h1>Interface de IA Generativa</h1>
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
      <div id="response-container">
        {error && <div className="error">{error}</div>}
        {response && <div className="response">{response}</div>}
      </div>
    </div>
  );
};

export default Chat;
