import Resolver from '@forge/resolver';
import { fetch, storage } from '@forge/api';

const resolver = new Resolver();

resolver.define('example', (req) => {
  console.log(req);
  return 'Hello, Data!';
});

resolver.define('getAiSettings', async () => {
  return await storage.get('aiSettings') || {
    topK: 50,
    topP: 0.9,
    temperature: 0.7,
    maxTokens: 150
  };
});

resolver.define('saveAiSettings', async (req) => {
  const settings = req.payload;
  await storage.set('aiSettings', settings);
  return { success: true };
});

resolver.define('sendAudioToN8n', async (req) => {
  const { audio } = req.payload;
  // Use process.env.N8N_WEBHOOK_URL for the endpoint
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!n8nUrl) {
    throw new Error("N8N_WEBHOOK_URL is not set in environment variables.");
  }

  
  // Use process.env.N8N_AUTH_TOKEN for the secure token
  const token = process.env.N8N_AUTH_TOKEN;

  if (!token) {
    throw new Error("N8N_AUTH_TOKEN is not set in environment variables.");
  }

  // Retrieve AI settings
  const aiSettings = await storage.get('aiSettings') || {
    topK: 50,
    topP: 0.9,
    temperature: 0.7,
    maxTokens: 150
  };

  const response = await fetch(n8nUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      audio,
      settings: aiSettings,
      modelParameters: aiSettings // Duplicating for clarity, depending on what n8n expects
    })
  });

  if (!response.ok) {
    throw new Error(`N8n responded with ${response.status} ${response.statusText}`);
  }

  return await response.json();
});

export const handler = resolver.getDefinitions();
