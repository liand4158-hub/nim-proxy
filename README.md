# NVIDIA NIM to OpenAI API Proxy

An OpenAI-compatible API proxy that forwards requests to NVIDIA NIM. Perfect for use with Janitor AI Android and other OpenAI-compatible clients.

## Features

- ✅ Full OpenAI API compatibility
- ✅ Streaming support
- ✅ Multiple NVIDIA NIM models
- ✅ CORS enabled
- ✅ Railway deployment ready
- ✅ Works with Janitor AI Android

## Quick Deploy to Railway

1. Click the button below to deploy to Railway:
   
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

2. Or manually deploy:
   - Create a new project on [Railway](https://railway.app)
   - Connect your GitHub repository
   - Railway will automatically detect and deploy the Node.js app
   - Your API will be available at: `https://your-app.railway.app`

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Usage with Janitor AI Android

1. Deploy the proxy to Railway (see above)
2. Get your NVIDIA NIM API key from [NVIDIA](https://build.nvidia.com/)
3. In Janitor AI Android settings:
   - **API Type**: OpenAI
   - **API URL**: `https://your-app.railway.app/v1`
   - **API Key**: Your NVIDIA NIM API key
   - **Model**: `meta/llama-3.1-8b-instruct` (or any supported model)

## Supported Models

- `meta/llama-3.1-405b-instruct` - Llama 3.1 405B (most capable)
- `meta/llama-3.1-70b-instruct` - Llama 3.1 70B (balanced)
- `meta/llama-3.1-8b-instruct` - Llama 3.1 8B (fastest, default)
- `mistralai/mixtral-8x7b-instruct-v0.1` - Mixtral 8x7B

## API Endpoints

### Health Check
```
GET /
```

### List Models
```
GET /v1/models
```

### Chat Completions
```
POST /v1/chat/completions
```

Example request:
```bash
curl https://your-app.railway.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_NVIDIA_API_KEY" \
  -d '{
    "model": "meta/llama-3.1-8b-instruct",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024,
    "stream": false
  }'
```

### Streaming Example
```bash
curl https://your-app.railway.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_NVIDIA_API_KEY" \
  -d '{
    "model": "meta/llama-3.1-8b-instruct",
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true
  }'
```

## Environment Variables

No environment variables are required. The API key is passed via the Authorization header.

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your NVIDIA API key
2. **CORS errors**: The proxy has CORS enabled by default
3. **Rate limits**: NVIDIA NIM has rate limits, check your plan
4. **Model not found**: Use one of the supported models listed above

### Testing Your Deployment

```bash
# Health check
curl https://your-app.railway.app/

# List models
curl https://your-app.railway.app/v1/models

# Test chat (replace YOUR_API_KEY)
curl https://your-app.railway.app/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"meta/llama-3.1-8b-instruct","messages":[{"role":"user","content":"Hi"}]}'
```

## How It Works

1. Your app (Janitor AI) sends OpenAI-formatted requests to this proxy
2. The proxy forwards requests to NVIDIA NIM API
3. NVIDIA NIM responses are returned in OpenAI format
4. Streaming is fully supported

## License

MIT

## Support

For issues or questions:
- Check NVIDIA NIM documentation: https://docs.api.nvidia.com/
- Check Railway documentation: https://docs.railway.app/
