// Import dependencies
import { verifyFirebaseToken } from './auth.js';
import { saveSegment, startConversation, endConversation } from './conversations.js';
import { generateSummary, getSummary, getUserSummaries } from './summaries.js';
import { analyzeSpeechAudio } from './gemini.js';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Decode JWT without verification (temporary - for development only)
function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    return null;
  }
}

// Firebase auth middleware
async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Missing auth header');
    return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);
  console.log('Token received, length:', token.length);

  // TEMPORARY: Just decode without full verification
  // TODO: Re-enable full verification once working
  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.sub) {
      throw new Error('Invalid token format');
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    console.log('Token decoded for user:', decoded.sub);
    return { userId: decoded.sub };
  } catch (error) {
    console.error('Auth error details:', error.message);
    return new Response(JSON.stringify({ error: 'Invalid token: ' + error.message }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
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

    // Analyze audio with Gemini
    if (pathname === '/api/analyze' && method === 'POST') {
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      try {
        const { audioBase64, mimeType } = await request.json();

        if (!audioBase64) {
          return new Response(JSON.stringify({ error: 'Audio data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await analyzeSpeechAudio(audioBase64, mimeType, env.GEMINI_API_KEY);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error analyzing audio:', error);
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
