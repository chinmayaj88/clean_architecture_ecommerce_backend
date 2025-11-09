
import { ResponseCache } from '../infrastructure/cache/ResponseCache';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache(60000); // 1 minute TTL
  });

  it('should store and retrieve cached data', () => {
    const key = 'test-key';
    const data = { message: 'test' };

    cache.set(key, data);
    const retrieved = cache.get(key);

    expect(retrieved).toEqual(data);
  });

  it('should return null for expired entries', (done) => {
    const key = 'test-key';
    const data = { message: 'test' };

    cache.set(key, data, 100); // 100ms TTL

    setTimeout(() => {
      const retrieved = cache.get(key);
      expect(retrieved).toBeNull();
      done();
    }, 150);
  });

  it('should generate cache keys correctly', () => {
    const key1 = cache.generateKey('GET', '/api/v1/products', 'page=1', 'user123');
    const key2 = cache.generateKey('GET', '/api/v1/products', 'page=1', 'user123');
    const key3 = cache.generateKey('GET', '/api/v1/products', 'page=2', 'user123');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('should delete cache entries', () => {
    const key = 'test-key';
    cache.set(key, { data: 'test' });
    
    expect(cache.get(key)).toBeDefined();
    
    cache.delete(key);
    expect(cache.get(key)).toBeNull();
  });

  it('should delete cache entries by pattern', () => {
    cache.set('GET:/api/v1/products:page=1', { data: 'test1' });
    cache.set('GET:/api/v1/products:page=2', { data: 'test2' });
    cache.set('GET:/api/v1/users:user123', { data: 'test3' });

    cache.deletePattern('GET:/api/v1/products*');

    expect(cache.get('GET:/api/v1/products:page=1')).toBeNull();
    expect(cache.get('GET:/api/v1/products:page=2')).toBeNull();
    expect(cache.get('GET:/api/v1/users:user123')).toBeDefined();
  });
});

