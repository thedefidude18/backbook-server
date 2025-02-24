class RateLimiter {
  constructor() {
    this.inMemoryStore = new Map();
  }

  async checkLoginAttempts(ip, email) {
    const key = `login:${ip}:${email}`;
    const now = Date.now();
    
    const record = this.inMemoryStore.get(key) || { attempts: 0, timestamp: now };
    
    // Reset attempts if 15 minutes have passed
    if (now - record.timestamp > 15 * 60 * 1000) {
      record.attempts = 0;
      record.timestamp = now;
    }
    
    record.attempts++;
    this.inMemoryStore.set(key, record);
    
    // Automatically delete the record after 15 minutes
    setTimeout(() => this.inMemoryStore.delete(key), 15 * 60 * 1000);
    
    return record.attempts;
  }

  async checkSignupAttempts(ip) {
    const key = `signup:${ip}`;
    const now = Date.now();
    
    const record = this.inMemoryStore.get(key) || { attempts: 0, timestamp: now };
    
    // Reset attempts if 1 hour has passed
    if (now - record.timestamp > 60 * 60 * 1000) {
      record.attempts = 0;
      record.timestamp = now;
    }
    
    record.attempts++;
    this.inMemoryStore.set(key, record);
    
    // Automatically delete the record after 1 hour
    setTimeout(() => this.inMemoryStore.delete(key), 60 * 60 * 1000);
    
    return record.attempts;
  }
}

module.exports = new RateLimiter();
