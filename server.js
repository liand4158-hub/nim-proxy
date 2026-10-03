const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json({ limit: '2mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NVIDIA NIM to OpenAI API Proxy',
    endpoints: {
      chat: '/v1/chat/completions',
      models: '/v1/models'
    }
  });
});

// Models endpoint
app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'z-ai/glm-5.3',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'nvidia'
      }
    ]
  });
});

// Main chat completions endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: { message: 'Missing or invalid Authorization header', type: 'invalid_request_error' }
      });
    }

    const apiKey = authHeader.substring(7);
    
const {
  messages,
  model,
  stream,
  temperature,
  max_tokens,
  top_p,
  frequency_penalty,
  presence_penalty
} = req.body;

console.log('JanitorAI request:', {
  model,
  messageCount: messages?.length,
  stream,
  temperature,
  max_tokens,
  top_p,
  frequency_penalty,
  presence_penalty,
  approxChars: JSON.stringify(messages || []).length,
  messageSizes: (messages || []).map((m, i) => ({
    index: i,
    role: m.role,
    chars: typeof m.content === 'string'
      ? m.content.length
      : JSON.stringify(m.content || '').length
  }))
});

// Validate required fields
if (!messages || !Array.isArray(messages)) {
  return res.status(400).json({ 
    error: { message: 'Messages array is required', type: 'invalid_request_error' }
  });
}

    // Default model if not specified
    const nimModel = model || 'meta/llama-3.1-8b-instruct';

    // Build NVIDIA NIM request
    const nimRequest = {
  model: nimModel,
  messages: messages,
  temperature: temperature !== undefined ? temperature : 0.7,
  top_p: top_p !== undefined ? top_p : 1,
  max_tokens: max_tokens !== undefined ? max_tokens : 1024,
  stream: false
};

    // Add optional parameters if provided
    if (frequency_penalty !== undefined) {
      nimRequest.frequency_penalty = frequency_penalty;
    }
    if (presence_penalty !== undefined) {
      nimRequest.presence_penalty = presence_penalty;
    }

    const nimUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';

    // Always use non-streaming mode for JanitorAI compatibility
nimRequest.stream = false;

const nimStart = Date.now();

console.log('Sending request to NVIDIA NIM...');

try {
  const response = await axios.post(nimUrl, nimRequest, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 120000
  });

  console.log(`NVIDIA NIM responded in ${Date.now() - nimStart}ms`);

  res.json(response.data);

} catch (error) {
  console.error(
    `NVIDIA NIM request failed after ${Date.now() - nimStart}ms:`,
    error.message
  );

  if (error.response) {
    return res.status(error.response.status).json(error.response.data);
  }

  res.status(500).json({
    error: {
      message: error.message || 'Internal server error',
      type: 'server_error'
    }
  });
}
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: { 
      message: 'Internal server error', 
      type: 'server_error' 
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NVIDIA NIM Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Chat endpoint: http://localhost:${PORT}/v1/chat/completions`);
});
