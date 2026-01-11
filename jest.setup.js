import '@testing-library/jest-dom'

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input) {
      const bytes = []
      for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i)
        if (charCode < 128) {
          bytes.push(charCode)
        } else if (charCode < 2048) {
          bytes.push((charCode >> 6) | 192)
          bytes.push((charCode & 63) | 128)
        } else {
          bytes.push((charCode >> 12) | 224)
          bytes.push(((charCode >> 6) & 63) | 128)
          bytes.push((charCode & 63) | 128)
        }
      }
      return new Uint8Array(bytes)
    }
  }
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input) {
      if (!input) return ''
      const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
      let result = ''
      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i]
        if (byte < 128) {
          result += String.fromCharCode(byte)
        } else if (byte >= 192 && byte < 224) {
          const byte2 = bytes[++i]
          result += String.fromCharCode(((byte & 31) << 6) | (byte2 & 63))
        } else if (byte >= 224 && byte < 240) {
          const byte2 = bytes[++i]
          const byte3 = bytes[++i]
          result += String.fromCharCode(((byte & 15) << 12) | ((byte2 & 63) << 6) | (byte3 & 63))
        } else {
          const byte2 = bytes[++i]
          const byte3 = bytes[++i]
          const byte4 = bytes[++i]
          const codePoint = ((byte & 7) << 18) | ((byte2 & 63) << 12) | ((byte3 & 63) << 6) | (byte4 & 63)
          result += String.fromCharCode(
            ((codePoint - 0x10000) >> 10) + 0xD800,
            ((codePoint - 0x10000) & 1023) + 0xDC00
          )
        }
      }
      return result
    }
  }
}

// Mock FormData class
global.FormData = class FormData {
  constructor() {
    this._data = new Map()
  }

  append(name, value) {
    this._data.set(name, value)
  }

  get(name) {
    return this._data.get(name)
  }

  has(name) {
    return this._data.has(name)
  }

  delete(name) {
    this._data.delete(name)
  }

  entries() {
    return this._data.entries()
  }

  forEach(callback) {
    this._data.forEach((value, key) => {
      callback(value, key, this)
    })
  }
}

// Mock File class
global.File = class File {
  constructor(fileBits, fileName, options = {}) {
    this.name = fileName
    this.type = options.type || ''
    this.size = fileBits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.size), 0)
    this.lastModified = options.lastModified || Date.now()
    this._content = fileBits
  }

  async text() {
    return this._content.join('')
  }

  async arrayBuffer() {
    const text = await this.text()
    return new TextEncoder().encode(text).buffer
  }
}

// Mock Request and Response for Next.js API routes
global.Request = class Request {
  constructor(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      configurable: true
    })
    Object.defineProperty(this, 'method', {
      value: init.method || 'GET',
      writable: false,
      configurable: true
    })
    this.headers = new Headers(init.headers)
    this.body = init.body
    this.json = async () => {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body)
      }
      return {}
    }
    this.formData = async () => {
      return this.body
    }
  }
}

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Headers(init.headers)
    this.json = async () => {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body)
      }
      return this.body
    }
    this.text = async () => {
      return this.body
    }
  }

  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers
      }
    })
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = {}
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers[key.toLowerCase()] = value
      })
    }
  }

  get(name) {
    return this.headers[name.toLowerCase()]
  }

  set(name, value) {
    this.headers[name.toLowerCase()] = value
  }

  has(name) {
    return name.toLowerCase() in this.headers
  }

  delete(name) {
    delete this.headers[name.toLowerCase()]
  }

  entries() {
    return Object.entries(this.headers)
  }

  forEach(callback) {
    Object.entries(this.headers).forEach(([key, value]) => {
      callback(value, key, this)
    })
  }
}

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

global.localStorage = localStorageMock

// Mock sessionStorage
global.sessionStorage = localStorageMock

// Mock fetch for Jest environment
const mockFetchQueue = [];
let mockFetchImpl = (url, options = {}) => {
  if (url === '/api/images/upload') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        url: 'https://example.com/uploaded-image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        originalSize: 1024,
        size: 512,
        compressionRatio: 0.5,
        format: 'webp'
      })
    });
  }
  return Promise.reject(new Error(`fetch not mocked: ${url}`));
};

// Global shared data store for Dexie mock
const sharedDexieData = new Map();

global.fetch = function(url, options) {
  if (mockFetchQueue.length > 0) {
    const mockFn = mockFetchQueue.shift();
    return mockFn(url, options);
  }
  return mockFetchImpl(url, options);
};

global.fetch.mockReset = function() {
  mockFetchQueue.length = 0;
  mockFetchImpl = (url, options = {}) => {
    if (url === '/api/images/upload') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          url: 'https://example.com/uploaded-image.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          originalSize: 1024,
          size: 512,
          compressionRatio: 0.5,
          format: 'webp'
        })
      });
    }
    return Promise.reject(new Error(`fetch not mocked: ${url}`));
  };
};

global.fetch.mockResolvedValueOnce = function(value) {
  mockFetchQueue.push(() => Promise.resolve(value));
  return global.fetch;
};

global.fetch.mockRejectedValueOnce = function(error) {
  mockFetchQueue.push(() => Promise.reject(error));
  return global.fetch;
};

global.fetch.mockImplementationOnce = function(impl) {
  mockFetchQueue.push(impl);
  return global.fetch;
};

Object.defineProperty(global.fetch, 'mockResolvedValue', {
  value: function(value) {
    mockFetchImpl = () => Promise.resolve(value);
    return global.fetch;
  }
});

Object.defineProperty(global.fetch, 'mockRejectedValue', {
  value: function(error) {
    mockFetchImpl = () => Promise.reject(error);
    return global.fetch;
  }
});

const mockCacheData = new Map();
const mockDebug = {
  log: (...args) => { if (process.env.DEBUG) console.log('[DEBUG]', ...args); }
};

let mockDatabaseInstance = null;

class MockObjectStore {
  constructor() {
    this.data = new Map();
  }

  put(entry, key) {
    const id = key || Date.now();
    this.data.set(id, entry);
    return Promise.resolve(id);
  }

  get(key) {
    return Promise.resolve(this.data.get(key) || null);
  }

  delete(key) {
    this.data.delete(key);
    return Promise.resolve(undefined);
  }

  clear() {
    this.data.clear();
    return Promise.resolve(undefined);
  }

  where(index) {
    return {
      equals: (value) => ({
        first: () => {
          for (const [key, entry] of this.data.entries()) {
            if (entry.fileHash === value) {
              return Promise.resolve({ ...entry, id: key });
            }
          }
          return Promise.resolve(null);
        }
      }),
      below: (value) => ({
        toArray: () => {
          const results = [];
          for (const [key, entry] of this.data.entries()) {
            if (entry.uploadedAt && new Date(entry.uploadedAt) < new Date(value)) {
              results.push({ ...entry, id: key });
            }
          }
          return Promise.resolve(results);
        }
      })
    };
  }

  toArray() {
    return Promise.resolve(Array.from(this.data.values()));
  }

  bulkAdd(entries) {
    entries.forEach((entry, i) => {
      const id = Date.now() + i;
      this.data.set(id, entry);
    });
    return Promise.resolve(Array.from(this.data.keys()));
  }

  bulkDelete(ids) {
    ids.forEach(id => this.data.delete(id));
    return Promise.resolve(undefined);
  }

  index(name) {
    return {
      get: (key) => Promise.resolve(this.data.get(key) || null)
    };
  }

  data;
}

class MockTransaction {
  constructor() {
    this.objectStoreInstance = new MockObjectStore();
  }

  objectStore(name) {
    return this.objectStoreInstance;
  }
}

class MockDatabase {
  constructor() {
    this.objectStoreInstance = new MockObjectStore();
  }

  createObjectStore(storeName, options) {
    return new MockObjectStore();
  }

  transaction(storeNames, mode) {
    return new MockTransaction();
  }

  table(tableName) {
    if (tableName === 'imageCache') {
      return this.imageCache;
    }
    return new MockObjectStore();
  }

  imageCache = {
    where: (index) => {
      return {
        equals: (value) => {
          return {
            first: () => {
              for (const [key, entry] of mockCacheData.entries()) {
                if (entry.fileHash === value && entry.imageUrl && entry.uploadedAt) {
                  return Promise.resolve({ ...entry, id: key, fileHash: value });
                }
              }
              return Promise.resolve(null);
            }
          };
        },
        anyOf: (values) => ({
          toArray: () => {
            const results = [];
            for (const [key, entry] of mockCacheData.entries()) {
              if (values.includes(entry.imageUrl)) {
                results.push({ ...entry, id: key });
              }
            }
            return Promise.resolve(results);
          }
        })
      };
    },
    add: (entry, key) => {
      const id = key || Date.now();
      mockCacheData.set(id, { 
        fileHash: entry.fileHash,
        imageUrl: entry.imageUrl, 
        uploadedAt: entry.uploadedAt || new Date(),
        lastAccessedAt: entry.lastAccessedAt || new Date(),
        accessCount: entry.accessCount || 1,
        fileSize: entry.fileSize
      });
      return Promise.resolve(id);
    },
    put: (entry, key) => {
      const id = key || Date.now();
      mockCacheData.set(id, { 
        fileHash: entry.fileHash,
        imageUrl: entry.imageUrl, 
        uploadedAt: entry.uploadedAt || new Date(),
        lastAccessedAt: entry.lastAccessedAt || new Date(),
        accessCount: entry.accessCount || 1,
        fileSize: entry.fileSize
      });
      return Promise.resolve(id);
    },
    get: (key) => {
      const entry = mockCacheData.get(key);
      return Promise.resolve(entry ? { ...entry, id: key } : null);
    },
    delete: (key) => {
      mockCacheData.delete(key);
      return Promise.resolve(undefined);
    },
    clear: () => {
      mockCacheData.clear();
      return Promise.resolve(undefined);
    },
    toArray: () => {
      const results = [];
      for (const [key, entry] of mockCacheData.entries()) {
        results.push({ ...entry, id: key });
      }
      return Promise.resolve(results);
    },
    bulkAdd: (entries) => {
      entries.forEach((entry, i) => {
        const id = Date.now() + i;
        mockCacheData.set(id, { 
          fileHash: entry.fileHash,
          imageUrl: entry.imageUrl, 
          uploadedAt: entry.uploadedAt || new Date(),
          lastAccessedAt: entry.lastAccessedAt || new Date(),
          accessCount: entry.accessCount || 1,
          fileSize: entry.fileSize
        });
      });
      return Promise.resolve(Array.from(mockCacheData.keys()));
    },
    bulkDelete: (ids) => {
      ids.forEach(id => mockCacheData.delete(id));
      return Promise.resolve(undefined);
    }
  };
}

// Mock IndexedDB for Jest environment
const indexedDBMock = {
  open: jest.fn((name, version) => {
    if (!mockDatabaseInstance) {
      mockDatabaseInstance = new MockDatabase();
    }
    const mockRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDatabaseInstance,
    };
    setImmediate(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest });
      }
    });
    return mockRequest;
  }),
  deleteDatabase: jest.fn(() => {
    mockDatabaseInstance = null;
    return Promise.resolve();
  }),
  databases: jest.fn(() => Promise.resolve([])),
};

// Mock Dexie class for Jest environment
jest.mock('dexie', () => {
  const mockCacheData = new Map();
  
  return class MockDexie {
    static databases = new Map();
    
    constructor(dbName) {
      this.dbName = dbName;
      this._ready = false;
      this._readyPromise = null;
      // Use shared table data store
      this._tableData = mockCacheData;
    }
    
    version(version) {
      return this;
    }
    
    stores(storesConfig) {
      return this;
    }
    
    async open() {
      if (!this._readyPromise) {
        this._readyPromise = new Promise((resolve) => {
          setImmediate(() => {
            this._ready = true;
            resolve(this);
          });
        });
      }
      return this._readyPromise;
    }
    
    table(tableName) {
      return {
        where: (index) => ({
          equals: (value) => ({
            first: async () => {
              const tableData = this._tableData.get(tableName) || new Map();
              for (const [key, entry] of tableData.entries()) {
                if (entry.fileHash === value) {
                  return { ...entry, id: key };
                }
              }
              return null;
            },
            above: (value) => ({
              toArray: async () => {
                const results = [];
                const tableData = this._tableData.get(tableName) || new Map();
                for (const [key, entry] of tableData.entries()) {
                  if (entry[index] > value) {
                    results.push({ ...entry, id: key });
                  }
                }
                return results;
              }
            }),
            below: (value) => ({
              toArray: async () => {
                const results = [];
                const tableData = this._tableData.get(tableName) || new Map();
                for (const [key, entry] of tableData.entries()) {
                  if (entry[index] && new Date(entry[index]) < new Date(value)) {
                    results.push({ ...entry, id: key });
                  }
                }
                return results;
              }
            })
          }),
          anyOf: (values) => ({
            toArray: async () => {
              const results = [];
              const tableData = this._tableData.get(tableName) || new Map();
              for (const [key, entry] of tableData.entries()) {
                if (values.includes(entry[index])) {
                  results.push({ ...entry, id: key });
                }
              }
              return results;
            }
          })
        }),
        add: async (entry, key) => {
          let tableData = this._tableData.get(tableName);
          if (!tableData) {
            tableData = new Map();
            this._tableData.set(tableName, tableData);
          }
          const id = key || Date.now() + Math.random();
          tableData.set(id, entry);
          return id;
        },
        put: async (entry, key) => {
          let tableData = this._tableData.get(tableName);
          if (!tableData) {
            tableData = new Map();
            this._tableData.set(tableName, tableData);
          }
          const id = key || Date.now() + Math.random();
          tableData.set(id, entry);
          return id;
        },
        get: async (key) => {
          const tableData = this._tableData.get(tableName) || new Map();
          return tableData.get(key) || null;
        },
        delete: async (key) => {
          const tableData = this._tableData.get(tableName);
          if (tableData) {
            tableData.delete(key);
          }
          return undefined;
        },
        update: async (key, changes) => {
          const tableData = this._tableData.get(tableName);
          if (tableData && tableData.has(key)) {
            const entry = tableData.get(key);
            tableData.set(key, { ...entry, ...changes });
            return 1;
          }
          return 0;
        },
        clear: async () => {
          const tableData = this._tableData.get(tableName);
          if (tableData) {
            tableData.clear();
          }
          return undefined;
        },
        toArray: async () => {
          const tableData = this._tableData.get(tableName) || new Map();
          return Array.from(tableData.values());
        },
        bulkAdd: async (entries) => {
          let tableData = this._tableData.get(tableName);
          if (!tableData) {
            tableData = new Map();
            this._tableData.set(tableName, tableData);
          }
          const ids = [];
          entries.forEach((entry, i) => {
            const id = Date.now() + i + Math.random();
            tableData.set(id, entry);
            ids.push(id);
          });
          return ids;
        },
        bulkDelete: async (ids) => {
          const tableData = this._tableData.get(tableName);
          if (tableData) {
            ids.forEach(id => tableData.delete(id));
          }
          return undefined;
        },
        count: async () => {
          const tableData = this._tableData.get(tableName) || new Map();
          return tableData.size;
        },
        orderBy: (index) => ({
          limit: (count) => ({
            toArray: async () => {
              const tableData = this._tableData.get(tableName) || new Map();
              const entries = Array.from(tableData.values());
              return entries.slice(0, count);
            }
          })
        })
      };
    }
    
    async close() {
      this._ready = false;
      this._readyPromise = null;
    }
    
    async clear() {
      this._tableData.clear();
    }
  };
});

global.indexedDB = indexedDBMock;

// Mock crypto.subtle for Jest environment
const fakeHash = new Uint8Array([
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
  0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
  0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20
]);

if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}

global.crypto.subtle = {
  digest: jest.fn((algorithm, data) => {
    return Promise.resolve(fakeHash.buffer);
  }),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
  deriveKey: jest.fn(),
  deriveBits: jest.fn(),
  importKey: jest.fn(),
  exportKey: jest.fn(),
  generateKey: jest.fn(),
  wrapKey: jest.fn(),
  unwrapKey: jest.fn(),
};