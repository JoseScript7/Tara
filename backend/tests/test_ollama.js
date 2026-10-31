const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/tags', (req, res) => res.json({ models: [] }));
app.post('/v1/chat/completions', (req, res) => {
  const userMsg = req.body.messages.find(m => m.role === 'user').content;
  let reply = "I am a local model.";
  
  if (userMsg.includes("compensation")) {
    reply = "I can offer you ₹500 compensation for the delay.";
  } else if (userMsg.includes("1234")) {
    reply = `I see your card ${userMsg.match(/\[REDACTED_CARD\]/)? '[REDACTED_CARD]' : '1234-5678'}.`;
  } else {
    reply = "The settlement is on time.";
  }
  
  res.json({
    choices: [{ message: { content: reply } }]
  });
});

const server = app.listen(11434, () => {
  console.log("Mock Ollama running on 11434");
});
