import { Router } from 'itty-router';
import { verifyFirebaseToken } from './auth';
import { saveSegment, startConversation, endConversation } from './conversations';
import { generateSummary, getSummary, getUserSummaries } from './summaries';

const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }));

// Auth middleware
async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);
  try {
    const decodedToken = await verifyFirebaseToken(token);
    return { userId: decodedToken.uid };
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Start a new conversation
router.post('/api/conversations/start', async (request, env) => {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json();
  const result = await startConversation(env.DB, auth.userId, body.title);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// End a conversation
router.post('/api/conversations/:id/end', async (request, env) => {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const { id } = request.params;
  const result = await endConversation(env.DB, id, auth.userId);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Save a speech segment with analysis
router.post('/api/segments', async (request, env) => {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  try {
    const segment = await request.json();
    const result = await saveSegment(env.DB, auth.userId, segment);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving segment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Generate summary for a conversation
router.post('/api/conversations/:id/summary', async (request, env) => {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  try {
    const { id } = request.params;
    const result = await generateSummary(env.DB, id, auth.userId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Get summary for a conversation
router.get('/api/conversations/:id/summary', async (request, env) => {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const { id } = request.params;
  const result = await getSummary(env.DB, id, auth.userId);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Get all summaries for a user
router.get('/api/summaries', async (request, env) => {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const result = await getUserSummaries(env.DB, auth.userId);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

export default {
  fetch: (request, env, ctx) => router.handle(request, env, ctx)
};
