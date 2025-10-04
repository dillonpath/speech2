// API service for communicating with Cloudflare Worker
class ApiService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL || 'http://localhost:8787';
    this.token = null;
  }

  setAuthToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Conversations
  async startConversation(title = null) {
    return this.request('/api/conversations/start', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  }

  async endConversation(conversationId) {
    return this.request(`/api/conversations/${conversationId}/end`, {
      method: 'POST'
    });
  }

  // Speech segments
  async saveSegment(segment) {
    return this.request('/api/segments', {
      method: 'POST',
      body: JSON.stringify(segment)
    });
  }

  // Analyze audio with Gemini
  async analyzeAudio(audioBase64, mimeType) {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ audioBase64, mimeType })
    });
  }

  // Summaries
  async generateSummary(conversationId) {
    return this.request(`/api/conversations/${conversationId}/summary`, {
      method: 'POST'
    });
  }

  async getSummary(conversationId) {
    return this.request(`/api/conversations/${conversationId}/summary`);
  }

  async getAllSummaries() {
    return this.request('/api/summaries');
  }
}

export default new ApiService();
