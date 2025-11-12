# API Response Examples

Examples of using zen-json-patch for efficient API communication and caching.

## Incremental Updates

Send only changed data instead of full payloads.

### PATCH Requests

```typescript
import { diff } from 'zen-json-patch';

interface User {
  id: string;
  name: string;
  email: string;
  profile: {
    bio: string;
    avatar: string;
  };
}

async function updateUser(userId: string, original: User, updated: User) {
  const operations = diff(original, updated);

  if (operations.length === 0) {
    console.log('No changes to save');
    return original;
  }

  // Send only the changes
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json-patch+json' },
    body: JSON.stringify(operations)
  });

  return response.json();
}

// Usage
const original = {
  id: '123',
  name: 'Alice',
  email: 'alice@example.com',
  profile: { bio: 'Developer', avatar: 'avatar1.jpg' }
};

const updated = {
  ...original,
  name: 'Alice Smith',
  profile: { ...original.profile, bio: 'Senior Developer' }
};

await updateUser('123', original, updated);
// Sends: [
//   { op: 'replace', path: '/name', value: 'Alice Smith' },
//   { op: 'replace', path: '/profile/bio', value: 'Senior Developer' }
// ]
```

### Express.js Server Handler

```typescript
import express from 'express';
import { applyPatch } from 'fast-json-patch';
import { Operation, isOperation } from 'zen-json-patch';

const app = express();

app.patch('/api/users/:id', async (req, res) => {
  const operations = req.body as Operation[];

  // Validate operations
  if (!Array.isArray(operations) || !operations.every(isOperation)) {
    return res.status(400).json({ error: 'Invalid JSON Patch' });
  }

  try {
    // Load current user
    const user = await db.users.findById(req.params.id);

    // Apply patch
    const { newDocument, error } = applyPatch(user, operations, true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Save updated user
    await db.users.update(req.params.id, newDocument);

    res.json(newDocument);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Cache Management

Efficiently update cached data using patches.

### Smart Cache Updates

```typescript
import { diff, Operation } from 'zen-json-patch';
import { applyPatch } from 'fast-json-patch';

class CacheManager<T> {
  private cache = new Map<string, T>();

  async get(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached) {
      // Fetch fresh data
      const fresh = await fetcher();

      // Calculate diff
      const operations = diff(cached, fresh);

      if (operations.length > 0) {
        console.log(`Cache updated: ${operations.length} changes`);
        this.cache.set(key, fresh);
        return fresh;
      }

      console.log('Cache hit: no changes');
      return cached;
    }

    // Cache miss
    const data = await fetcher();
    this.cache.set(key, data);
    return data;
  }

  patch(key: string, operations: Operation[]): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const { newDocument } = applyPatch(cached, operations);
    this.cache.set(key, newDocument);

    return newDocument;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

// Usage
const cache = new CacheManager<User>();

// First fetch
const user1 = await cache.get('user:123', () =>
  fetch('/api/users/123').then(r => r.json())
);

// Later fetch
const user2 = await cache.get('user:123', () =>
  fetch('/api/users/123').then(r => r.json())
);

// If data changed, cache is updated
// If data unchanged, cached version is returned
```

### Conditional Requests with ETags

```typescript
import { diff } from 'zen-json-patch';

interface CacheEntry<T> {
  data: T;
  etag: string;
}

class ETagCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  async fetch(url: string): Promise<T> {
    const cached = this.cache.get(url);

    const headers: HeadersInit = {
      'Accept': 'application/json'
    };

    // Add If-None-Match header for conditional request
    if (cached) {
      headers['If-None-Match'] = cached.etag;
    }

    const response = await fetch(url, { headers });

    if (response.status === 304) {
      // Not modified - use cache
      console.log('304 Not Modified - using cache');
      return cached!.data;
    }

    const data = await response.json();
    const etag = response.headers.get('ETag') || '';

    // Log changes if we had cached data
    if (cached) {
      const operations = diff(cached.data, data);
      console.log(`Data updated: ${operations.length} changes`);
    }

    this.cache.set(url, { data, etag });
    return data;
  }
}

// Usage
const cache = new ETagCache<User>();

const user = await cache.fetch('/api/users/123');
// Server returns 200 with data and ETag

const userAgain = await cache.fetch('/api/users/123');
// Server returns 304 if not modified, or 200 with new data
```

## Real-time Sync

Synchronize data changes in real-time.

### WebSocket Sync

```typescript
import { diff, Operation } from 'zen-json-patch';
import { applyPatch } from 'fast-json-patch';

class RealtimeSync<T extends object> {
  private data: T;
  private ws: WebSocket;

  constructor(initialData: T, wsUrl: string) {
    this.data = initialData;
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const operations: Operation[] = JSON.parse(event.data);
      this.applyRemoteChanges(operations);
    };
  }

  update(updater: (data: T) => T): void {
    const previous = this.data;
    this.data = updater(this.data);

    const operations = diff(previous, this.data);

    if (operations.length > 0) {
      // Send changes to server
      this.ws.send(JSON.stringify(operations));
    }
  }

  private applyRemoteChanges(operations: Operation[]): void {
    console.log('Received remote changes:', operations);

    const { newDocument } = applyPatch(this.data, operations);
    this.data = newDocument;

    // Notify UI to re-render
    this.notifyListeners();
  }

  private listeners: Array<(data: T) => void> = [];

  subscribe(listener: (data: T) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.data));
  }

  getData(): T {
    return this.data;
  }
}

// Usage
interface Document {
  title: string;
  content: string;
  author: string;
}

const sync = new RealtimeSync<Document>(
  { title: 'Untitled', content: '', author: 'Alice' },
  'ws://localhost:3000/sync'
);

sync.subscribe((data) => {
  console.log('Data updated:', data);
  // Update UI
});

// Local change
sync.update(doc => ({ ...doc, title: 'My Document' }));
// Sends patch to server

// Remote change arrives via WebSocket
// Automatically applied and UI updated
```

### Conflict Resolution

```typescript
import { diff, Operation } from 'zen-json-patch';

interface ConflictResolution<T> {
  resolved: T;
  conflicts: Array<{ path: string; ours: any; theirs: any }>;
}

function resolveConflicts<T>(
  base: T,
  ours: T,
  theirs: T
): ConflictResolution<T> {
  const ourChanges = diff(base, ours);
  const theirChanges = diff(base, theirs);

  const conflicts: Array<{ path: string; ours: any; theirs: any }> = [];

  // Find conflicting paths
  const conflictPaths = new Set<string>();
  ourChanges.forEach(ourOp => {
    theirChanges.forEach(theirOp => {
      if (ourOp.path === theirOp.path) {
        conflictPaths.add(ourOp.path);

        const ourValue = ourOp.op === 'remove' ? undefined : (ourOp as any).value;
        const theirValue = theirOp.op === 'remove' ? undefined : (theirOp as any).value;

        conflicts.push({
          path: ourOp.path,
          ours: ourValue,
          theirs: theirValue
        });
      }
    });
  });

  // Simple resolution: prefer theirs for conflicts
  let resolved = { ...ours };

  theirChanges.forEach(op => {
    if (conflictPaths.has(op.path)) {
      // Apply their change (last write wins)
      if (op.op === 'replace' || op.op === 'add') {
        const pathParts = op.path.split('/').filter(Boolean);
        let current: any = resolved;

        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }

        const lastPart = pathParts[pathParts.length - 1];
        current[lastPart] = (op as any).value;
      } else if (op.op === 'remove') {
        const pathParts = op.path.split('/').filter(Boolean);
        let current: any = resolved;

        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }

        const lastPart = pathParts[pathParts.length - 1];
        delete current[lastPart];
      }
    }
  });

  return { resolved, conflicts };
}

// Usage
const base = { title: 'Document', author: 'Alice', version: 1 };
const ours = { title: 'My Document', author: 'Alice', version: 1 };
const theirs = { title: 'Shared Document', author: 'Bob', version: 1 };

const { resolved, conflicts } = resolveConflicts(base, ours, theirs);

console.log('Resolved:', resolved);
// { title: 'Shared Document', author: 'Bob', version: 1 }

console.log('Conflicts:', conflicts);
// [
//   { path: '/title', ours: 'My Document', theirs: 'Shared Document' },
//   { path: '/author', ours: 'Alice', theirs: 'Bob' }
// ]
```

## Polling Optimization

Reduce bandwidth when polling for updates.

### Smart Polling

```typescript
import { diff } from 'zen-json-patch';

class SmartPoller<T> {
  private lastData: T | null = null;
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private url: string,
    private pollInterval: number,
    private onUpdate: (data: T, changes: Operation[]) => void
  ) {}

  start(): void {
    this.poll();
    this.interval = setInterval(() => this.poll(), this.pollInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const response = await fetch(this.url);
      const data: T = await response.json();

      if (this.lastData) {
        const changes = diff(this.lastData, data);

        if (changes.length > 0) {
          console.log(`Detected ${changes.length} changes`);
          this.onUpdate(data, changes);
        } else {
          console.log('No changes detected');
        }
      } else {
        // First poll
        this.onUpdate(data, []);
      }

      this.lastData = data;
    } catch (error) {
      console.error('Polling error:', error);
    }
  }
}

// Usage
interface Status {
  online: boolean;
  users: number;
  lastActivity: string;
}

const poller = new SmartPoller<Status>(
  '/api/status',
  5000, // Poll every 5 seconds
  (data, changes) => {
    if (changes.length > 0) {
      console.log('Status updated:', changes);
      updateUI(data);
    }
  }
);

poller.start();

// Stop polling when done
// poller.stop();
```

## GraphQL Integration

Use patches with GraphQL mutations.

### Patch-based Mutations

```typescript
import { diff, Operation } from 'zen-json-patch';

async function updateWithPatch<T>(
  id: string,
  original: T,
  updated: T
): Promise<T> {
  const operations = diff(original, updated);

  if (operations.length === 0) {
    return original;
  }

  const mutation = `
    mutation UpdateWithPatch($id: ID!, $operations: [JSONPatchOperation!]!) {
      updateWithPatch(id: $id, operations: $operations) {
        id
        name
        email
        profile {
          bio
          avatar
        }
      }
    }
  `;

  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: mutation,
      variables: { id, operations }
    })
  });

  const result = await response.json();
  return result.data.updateWithPatch;
}
```

## Bandwidth Comparison

Compare full updates vs. patches:

```typescript
import { diff } from 'zen-json-patch';

function compareApproaches(original: any, updated: any): void {
  // Full replacement
  const fullSize = new Blob([JSON.stringify(updated)]).size;

  // Patch
  const operations = diff(original, updated);
  const patchSize = new Blob([JSON.stringify(operations)]).size;

  const savings = ((fullSize - patchSize) / fullSize * 100).toFixed(1);

  console.log(`Full update: ${fullSize} bytes`);
  console.log(`Patch: ${patchSize} bytes`);
  console.log(`Savings: ${savings}%`);

  // Decide which approach to use
  if (patchSize < fullSize * 0.5) {
    console.log('Use patch (significant savings)');
    return operations;
  } else {
    console.log('Use full update (patch not worth it)');
    return updated;
  }
}

// Example
const original = {
  // Large object with many fields
  users: Array(100).fill(null).map((_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    active: true
  }))
};

const updated = {
  ...original,
  users: original.users.map(u =>
    u.id === 42 ? { ...u, name: 'Updated User' } : u
  )
};

compareApproaches(original, updated);
// Full update: 7850 bytes
// Patch: 62 bytes
// Savings: 99.2%
// Use patch (significant savings)
```

## Best Practices

### 1. Set Size Thresholds

Don't use patches when they're not beneficial:

```typescript
const operations = diff(old, new);
const fullSize = JSON.stringify(new).length;
const patchSize = JSON.stringify(operations).length;

if (patchSize < fullSize * 0.7) {
  // Use patch
  await api.patch(url, operations);
} else {
  // Use full update
  await api.put(url, new);
}
```

### 2. Handle Network Failures

Implement retry logic for patch operations:

```typescript
async function patchWithRetry(
  url: string,
  operations: Operation[],
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify(operations)
      });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 3. Validate Patches

Always validate patch operations on the server:

```typescript
function isValidPatch(operations: any[]): boolean {
  return Array.isArray(operations) &&
    operations.every(op =>
      op &&
      typeof op === 'object' &&
      ['add', 'remove', 'replace'].includes(op.op) &&
      typeof op.path === 'string'
    );
}
```

## Next Steps

- [State Management Examples](/examples/state-management)
- [Version Control Examples](/examples/version-control)
- [API Reference](/api/)
