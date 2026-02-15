// Test script for the NVIDIA NIM proxy
// Usage: node test.js YOUR_NVIDIA_API_KEY

const axios = require('axios');

const API_KEY = process.argv[2];
const BASE_URL = process.argv[3] || 'http://localhost:3000';

if (!API_KEY) {
  console.error('Usage: node test.js YOUR_NVIDIA_API_KEY [BASE_URL]');
  process.exit(1);
}

async function testHealthCheck() {
  console.log('\n🔍 Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testModels() {
  console.log('\n🔍 Testing models endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/v1/models`);
    console.log('✅ Models endpoint passed');
    console.log('Available models:', response.data.data.map(m => m.id).join(', '));
    return true;
  } catch (error) {
    console.error('❌ Models endpoint failed:', error.message);
    return false;
  }
}

async function testChatCompletion() {
  console.log('\n🔍 Testing chat completion...');
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/chat/completions`,
      {
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'user', content: 'Say "Hello, this is a test!" and nothing else.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Chat completion passed');
    console.log('Response:', response.data.choices[0].message.content);
    console.log('Model used:', response.data.model);
    console.log('Tokens used:', response.data.usage);
    return true;
  } catch (error) {
    console.error('❌ Chat completion failed:', error.response?.data || error.message);
    return false;
  }
}

async function testStreaming() {
  console.log('\n🔍 Testing streaming...');
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/chat/completions`,
      {
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'user', content: 'Count from 1 to 5.' }
        ],
        max_tokens: 50,
        stream: true
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );
    
    console.log('✅ Streaming started');
    
    return new Promise((resolve) => {
      let chunks = 0;
      response.data.on('data', (chunk) => {
        chunks++;
        process.stdout.write('.');
      });
      
      response.data.on('end', () => {
        console.log(`\n✅ Streaming completed (${chunks} chunks received)`);
        resolve(true);
      });
      
      response.data.on('error', (error) => {
        console.error('\n❌ Streaming failed:', error.message);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('❌ Streaming failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting NVIDIA NIM Proxy Tests');
  console.log('Base URL:', BASE_URL);
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  
  const results = {
    healthCheck: await testHealthCheck(),
    models: await testModels(),
    chatCompletion: await testChatCompletion(),
    streaming: await testStreaming()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
  process.exit(allPassed ? 0 : 1);
}

runTests();
