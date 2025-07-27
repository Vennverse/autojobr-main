import session from 'express-session';
import MemoryStore from 'memorystore';

// Simple session store configuration (no Redis)
export async function createSessionStore() {
  try {
    console.log('✅ Using memory store for session storage');
    const MemStore = MemoryStore(session);
    return new MemStore({
      checkPeriod: 86400000, // 24 hours
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      max: 10000, // Maximum number of sessions
    });
  } catch (error) {
    console.error('Error creating session store:', error);
    // Fallback to default memory store
    return new session.MemoryStore();
  }
}