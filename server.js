const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

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
    const { messages, model, stream, temperature, max_tokens, top_p, frequency_penalty, presence_penalty } = req.body;

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
      stream: stream || false
    };

    // Add optional parameters if provided
    if (frequency_penalty !== undefined) {
      nimRequest.frequency_penalty = frequency_penalty;
    }
    if (presence_penalty !== undefined) {
      nimRequest.presence_penalty = presence_penalty;
    }

    const nimUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';

    if (stream) {
      // Streaming response
      const response = await axios.post(nimUrl, nimRequest, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        responseType: 'stream'
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.data.pipe(res);
    } else {
      // Non-streaming response
      const response = await axios.post(nimUrl, nimRequest, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Return NVIDIA NIM response as-is (already in OpenAI format)
      res.json(response.data);
    }
  } catch (error) {
    console.error('Error proxying request:', error.message);
    
    if (error.response) {
      // Forward NVIDIA NIM error response
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Generic error response
    res.status(500).json({ 
      error: { 
        message: error.message || 'Internal server error', 
        type: 'server_error' 
      }
    });
  }
});

// Completions endpoint (legacy, redirects to chat completions)
app.post('/v1/completions', async (req, res) => {
  try {
    const { prompt, ...otherParams } = req.body;
    
    // Convert prompt to messages format
    const messages = [{ role: 'user', content: prompt }];
    
    // Forward to chat completions endpoint
    req.body = {
      messages,
      ...otherParams
    };
    
    return app._router.handle(
      { ...req, url: '/v1/chat/completions', method: 'POST' },
      res
    );
  } catch (error) {
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
app.listen(PORT, () => {
  console.log(`NVIDIA NIM Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Chat endpoint: http://localhost:${PORT}/v1/chat/completions`);
});
