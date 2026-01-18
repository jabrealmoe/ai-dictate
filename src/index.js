const Resolver = require('@forge/resolver').default;
const { fetch, storage, api, route } = require('@forge/api');

const resolver = new Resolver();

resolver.define('example', (req) => {
  console.log(req);
  return 'Hello, Data!';
});

resolver.define('getAiSettings', async () => {
  return await storage.get('aiSettings') || {
    topK: -1,
    topP: 0.9,
    temperature: 0.7,
    maxTokens: 2048
  };
});

resolver.define('saveAiSettings', async (req) => {
  const settings = req.payload;
  await storage.set('aiSettings', settings);
  return { success: true };
});

resolver.define('createJiraIssue', async (req) => {
  const { summary, description, issueType, projectKey, priority } = req.payload;

  const bodyData = {
    fields: {
      summary: summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                text: description || "",
                type: "text"
              }
            ]
          }
        ]
      },
      issuetype: {
        name: issueType || "Task"
      }
    }
  };

  // If we have a project key context, use it. Otherwise need to determine how to get it.
  // For now, let's assume the frontend passes the project key or we default if mostly used in one project.
  // Ideally, the app running in issue context or project context should provide this.
  // Let's rely on passed payload or fail if missing.
  if (projectKey) {
     bodyData.fields.project = { key: projectKey };
  } else {
      // Fallback or error? For context app, we might need to get context.
      // But let's assume the frontend will pass `extension.project.key` or similar.
      throw new Error("Project key is required to create an issue.");
  }
  
  if (priority) {
      bodyData.fields.priority = { name: priority };
  }

  const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  });

  if (!response.ok) {
      const err = await response.text();
      console.error("Jira Creation Failed:", err);
      throw new Error(`Failed to create issue: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
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
    topK: -1,
    topP: 0.9,
    temperature: 0.7,
    maxTokens: 2048
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
      modelParameters: aiSettings
    })
  });

  if (!response.ok) {
    throw new Error(`N8n responded with ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  console.log("N8n Response:", text); // Log the response for debugging in recent tunnel
  try {
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    console.warn("Received non-JSON response from N8n:", text);
    // Return a structured object so the frontend can handle it gracefully
    return { 
      message: "Received non-JSON response from backend", 
      rawContent: text 
    };
  }
});

exports.handler = resolver.getDefinitions();
