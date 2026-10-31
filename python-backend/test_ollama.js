const express = require('express');
const app = express();
app.use(express.json());
app.post('/v1/chat/completions', (req, res) => {
  res.json({
    choices: [{
      message: {
        content: "",
        tool_calls: [{
          id: "call_123",
          type: "function",
          function: {
            name: "draftCompensationCredit",
            arguments: '{"amount": 100}'
          }
        }]
      }
    }]
  });
});
app.listen(11434, () => console.log("Mock Ollama up"));
