import { Platform } from 'react-native';

const getApiBase = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return Platform.OS === 'web' ? 'http://localhost:3001/api' : 'http://localhost:3001/api';
  }
  throw new Error('EXPO_PUBLIC_API_URL environment variable is required in production. ' +
    'Set it in .env or as an environment variable before starting the app.');
};

const API_BASE = getApiBase();

const TOKEN_KEY = 'toklok_auth_token';
const REFRESH_TOKEN_KEY = 'toklok_refresh_token';
let authToken: string | null = null;
let refreshToken: string | null = null;

export async function loadToken() {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(TOKEN_KEY);
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      authToken = stored;
      refreshToken = storedRefresh;
      return;
    }
    const SecureStore = await import('expo-secure-store');
    authToken = await SecureStore.getItemAsync(TOKEN_KEY);
    refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch { authToken = null; refreshToken = null; }
}

export function setToken(token: string | null, refresh?: string | null) {
  authToken = token;
  if (refresh !== undefined) refreshToken = refresh;
  if (Platform.OS === 'web') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (refresh !== undefined) {
      if (refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
    return;
  }
  if (token) {
    import('expo-secure-store').then(m => m.setItemAsync(TOKEN_KEY, token)).catch(() => {});
  } else {
    import('expo-secure-store').then(m => m.deleteItemAsync(TOKEN_KEY)).catch(() => {});
  }
  if (refresh !== undefined) {
    if (refresh) {
      import('expo-secure-store').then(m => m.setItemAsync(REFRESH_TOKEN_KEY, refresh)).catch(() => {});
    } else {
      import('expo-secure-store').then(m => m.deleteItemAsync(REFRESH_TOKEN_KEY)).catch(() => {});
    }
  }
}

export function getToken() {
  return authToken;
}

export function getRefreshToken() {
  return refreshToken;
}

function fixBooleans(obj: any): any {
  if (Array.isArray(obj)) return obj.map(fixBooleans);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      let v = fixBooleans(value);
      if (typeof v === 'string' && v.startsWith('[')) {
        try { v = JSON.parse(v); } catch (e) { console.error(e); }
      }
      result[key] = v;
    }
    return result;
  }
  if (typeof obj === 'string' && obj.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return obj;
  }
  return obj;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      let v = transformKeys(value);
      if (camelKey === 'isPrivate' || camelKey === 'isCreator' || camelKey === 'isVerified' ||
          camelKey === 'isUserVerified' || camelKey === 'commentsEnabled' || camelKey === 'isArchived' ||
          camelKey === 'isRead' || camelKey === 'isLikedByUser' || camelKey === 'isBookmarkedByUser' ||
          camelKey === 'isFollowingCreator') {
        if (typeof v === 'number') v = v === 1;
      }
      result[camelKey] = v;
    }
    return result;
  }
  return obj;
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const tryRequest = async (): Promise<any> => {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || res.statusText || 'Request failed';
      const err = new Error(msg) as any;
      err.status = res.status;
      err.data = data;
      throw err;
    }
    const transformed = transformKeys(data);
    return fixBooleans(transformed);
  };

  try {
    return await tryRequest();
  } catch (e: any) {
    // Auto-refresh on 401: try to get a new access token using the refresh token
    if (e.status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.token;
          const newRefreshToken = refreshData.refreshToken;
          if (newToken) {
            setToken(newToken, newRefreshToken || null);
            headers['Authorization'] = `Bearer ${newToken}`;
            // Retry the original request with the new token
            try {
              return await tryRequest();
            } catch (retryErr: any) {
              if (retryErr.status === 401) {
                // Refresh token also expired — force logout
                setToken(null, null);
              }
              throw retryErr;
            }
          }
        } else {
          // Refresh failed — force logout
          setToken(null, null);
          import('../stores/authStore').then(m => m.useAuthStore.getState().logout()).catch(() => {});
        }
      } catch {
        import('../stores/authStore').then(m => m.useAuthStore.getState().logout()).catch(() => {});
      }
    }
    throw e;
  }
}

async function uploadRequest(path: string, formData: FormData) {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || res.statusText || 'Upload failed';
    throw new Error(msg);
  }
  const transformed = transformKeys(data);
  return fixBooleans(transformed);
}

export const api = {
  auth: {
    signup: (data: { username: string; displayName: string; email?: string; phone?: string; password: string }) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { login: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    refresh: (refreshToken: string) =>
      request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    logout: (data?: { refreshToken?: string | null }) =>
      request('/auth/logout', { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
    me: () => request('/auth/me'),
    forgotPassword: (email: string) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (email: string, token: string, newPassword: string) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) }),
    socialLogin: (data: { provider: string; token: string; email?: string; displayName?: string }) =>
      request('/auth/social', { method: 'POST', body: JSON.stringify(data) }),
  },
  posts: {
    list: (page = 1, limit = 10) => request(`/posts?page=${page}&limit=${limit}`),
    get: (id: string) => request(`/posts/${id}`),
    create: (formData: FormData) => uploadRequest('/posts', formData),
    update: (id: string, data: Record<string, any>) =>
      request(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),
    feed: (type = 'explore', page = 1) => request(`/posts/feed?type=${type}&page=${page}`),
    explore: (page = 1) => request(`/posts/explore?page=${page}`),
    like: (id: string) => request(`/posts/${id}/like`, { method: 'POST' }),
    unlike: (id: string) => request(`/posts/${id}/like`, { method: 'DELETE' }),
    bookmark: (id: string) => request(`/posts/${id}/bookmark`, { method: 'POST' }),
    unbookmark: (id: string) => request(`/posts/${id}/bookmark`, { method: 'DELETE' }),
    bookmarked: () => request('/posts/bookmarked'),
    search: (q: string) => request(`/posts/search?q=${encodeURIComponent(q)}`),
    hashtagsTrending: () => request('/posts/hashtags/trending'),
    analytics: () => request('/posts/analytics'),
    leaderboard: (period = 'weekly') => request(`/posts/leaderboard?period=${period}`),
    nearby: (lat: number, lng: number, radius = 10) => request(`/posts/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  },
  comments: {
    list: (postId: string) => request(`/posts/${postId}/comments`),
    add: (postId: string, data: { content: string; parentCommentId?: string | null }) =>
      request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (postId: string, commentId: string) =>
      request(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
    like: (postId: string, commentId: string) =>
      request(`/posts/${postId}/comments/${commentId}/like`, { method: 'POST' }),
    unlike: (postId: string, commentId: string) =>
      request(`/posts/${postId}/comments/${commentId}/like`, { method: 'DELETE' }),
  },
  notifications: {
    list: () => request('/notifications'),
    unreadCount: () => request('/notifications/unread-count'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
  },
  reports: {
    list: (page = 1, status = 'all') => request(`/reports?page=${page}&status=${status}`),
    create: (data: { targetType: string; targetId: string; reason: string }) =>
      request('/reports', { method: 'POST', body: JSON.stringify(data) }),
    action: (id: string, action: string) =>
      request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  },
  admin: {
    kpi: () => request('/admin/kpi'),
    auditLog: (page = 1) => request(`/admin/audit-log?page=${page}`),
  },
  users: {
    get: (id: string) => request(`/users/${id}`),
    posts: (id: string, page = 1) => request(`/users/${id}/posts?page=${page}`),
    update: (data: Record<string, any>) =>
      request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    search: (q: string) => request(`/users/search?q=${encodeURIComponent(q)}`),
    follow: (id: string) => request(`/users/${id}/follow`, { method: 'POST' }),
    unfollow: (id: string) => request(`/users/${id}/follow`, { method: 'DELETE' }),
    approveFollowRequest: (id: string) => request(`/users/${id}/approve-request`, { method: 'POST' }),
    declineFollowRequest: (id: string) => request(`/users/${id}/decline-request`, { method: 'DELETE' }),
    followers: (id: string) => request(`/users/${id}/followers`),
    following: (id: string) => request(`/users/${id}/following`),
    block: (id: string) => request(`/users/block/${id}`, { method: 'POST' }),
    unblock: (id: string) => request(`/users/block/${id}`, { method: 'DELETE' }),
    getBlocked: () => request('/users/blocked'),
    suggested: () => request('/users/suggested'),
    uploadAvatar: (formData: FormData) => uploadRequest('/users/avatar', formData),
  },
  push: {
    register: (token: string, platform: string) =>
      request('/push/register', { method: 'POST', body: JSON.stringify({ token, platform }) }),
    unregister: (token: string) =>
      request('/push/unregister', { method: 'POST', body: JSON.stringify({ token }) }),
  },
  postsRelationships: {
    createDuet: (postId: string, data?: Record<string, any>) =>
      request(`/posts/${postId}/duet`, { method: 'POST', body: JSON.stringify(data || {}) }),
    createStitch: (postId: string, data?: Record<string, any>) =>
      request(`/posts/${postId}/stitch`, { method: 'POST', body: JSON.stringify(data || {}) }),
    getRelationships: (postId: string) =>
      request(`/posts/${postId}/relationships`),
    repost: (postId: string) =>
      request(`/posts/${postId}/repost`, { method: 'POST' }),
    removeRepost: (postId: string) =>
      request(`/posts/${postId}/repost`, { method: 'DELETE' }),
  },
  account: {
    delete: (password: string) =>
      request('/account', { method: 'DELETE', body: JSON.stringify({ password }) }),
    deactivate: () => request('/account/deactivate', { method: 'POST' }),
    reactivate: () => request('/account/reactivate', { method: 'POST' }),
  },
  collections: {
    list: () => request('/collections'),
    create: (name: string, emoji?: string) =>
      request('/collections', { method: 'POST', body: JSON.stringify({ name, emoji }) }),
    addPost: (collectionId: string, postId: string) =>
      request(`/collections/${collectionId}/posts`, { method: 'POST', body: JSON.stringify({ postId }) }),
    removePost: (collectionId: string, postId: string) =>
      request(`/collections/${collectionId}/posts/${postId}`, { method: 'DELETE' }),
    getPosts: (id: string) => request(`/collections/${id}`),
  },
  messages: {
    conversations: () => request('/messages/conversations'),
    createConversation: (userId: string) =>
      request('/messages/conversations', { method: 'POST', body: JSON.stringify({ userId }) }),
    getMessages: (conversationId: string, page = 1) =>
      request(`/messages/conversations/${conversationId}/messages?page=${page}`),
    sendMessage: (conversationId: string, content: string) =>
      request(`/messages/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
    markRead: (conversationId: string) =>
      request(`/messages/conversations/${conversationId}/read`, { method: 'POST' }),
  },
  hashtags: {
    get: (tag: string, page = 1) => request(`/hashtags/${encodeURIComponent(tag)}?page=${page}`),
    search: (q: string) => request(`/hashtags/search?q=${encodeURIComponent(q)}`),
  },
  sounds: {
    trending: () => request('/sounds/trending'),
    search: (q: string) => request(`/sounds/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => request(`/sounds/${id}`),
  },
  drafts: {
    list: () => request('/drafts'),
    save: (data: Record<string, any>) =>
      request('/drafts', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/drafts/${id}`, { method: 'DELETE' }),
    clear: () => request('/drafts', { method: 'DELETE' }),
  },
  settings: {
    getPreferences: () => request('/settings/preferences'),
    updatePreferences: (data: Record<string, any>) =>
      request('/settings/preferences', { method: 'PUT', body: JSON.stringify(data) }),
  },
  search: {
    all: (q: string, page = 1) =>
      request(`/search?q=${encodeURIComponent(q)}&page=${page}`),
    logClick: (searchHistoryId: string, resultId: string, resultType: string) =>
      request('/search/click', { method: 'POST', body: JSON.stringify({ searchHistoryId, resultId, resultType }) }),
    history: (limit = 20) => request(`/search/history?limit=${limit}`),
    trending: (limit = 10) => request(`/search/trending?limit=${limit}`),
  },
};
