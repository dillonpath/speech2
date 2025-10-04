// Import dependencies
// import { verifyFirebaseToken } from './auth'; // TODO: Enable after testing
import { saveSegment, startConversation, endConversation } from './conversations.js';
import { generateSummary, getSummary, getUserSummaries } from './summaries.js';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Temporary auth middleware (will verify Firebase tokens later)
async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // TODO: Verify Firebase token
  // const token = authHeader.substring(7);
  // const decodedToken = await verifyFirebaseToken(token);

  // Temporary: return mock user for testing
  return { userId: 'test-user-123' };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (pathname === '/health' && method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Start conversation
    if (pathname === '/api/conversations/start' && method === 'POST') {
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      try {
        const body = await request.json();
        const result = await startConversation(env.DB, auth.userId, body.title);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // End conversation
    if (pathname.match(/^\/api\/conversations\/[^/]+\/end$/) && method === 'POST') {
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      const id = pathname.split('/')[3];

      try {
        const result = await endConversation(env.DB, id, auth.userId);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Save segment
    if (pathname === '/api/segments' && method === 'POST') {
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      try {
        const segment = await request.json();
        const result = await saveSegment(env.DB, auth.userId, segment);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate summary
    if (pathname.match(/^\/api\/conversations\/[^/]+\/summary$/) && method === 'POST') {
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      const id = pathname.split('/')[3];

      try {
        const result = await generateSummary(env.DB, id, auth.userId);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get summary
    if (pathname.match(/^\/api\/conversations\/[^/]+\/summary$/) && method === 'GET') {
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      const id = pathname.split('/')[3];

      try {
        const result = await getSummary(env.DB, id, auth.userId);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get all summaries
    if (pathname === '/api/summaries' && method === 'GET') {
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      try {
        const result = await getUserSummaries(env.DB, auth.userId);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 404 - Not found
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
