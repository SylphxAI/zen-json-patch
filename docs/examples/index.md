# Examples Overview

Real-world examples of using zen-json-patch in different scenarios.

## Quick Examples

### Basic Object Diff

The simplest use case - comparing two objects:

```typescript
import { diff } from 'zen-json-patch';

const before = { name: "Alice", age: 30 };
const after = { name: "Alice", age: 31, role: "admin" };

const patch = diff(before, after);
// [
//   { op: 'replace', path: '/age', value: 31 },
//   { op: 'add', path: '/role', value: 'admin' }
// ]
```

### Detecting Changes

Check if any changes occurred:

```typescript
const operations = diff(oldData, newData);

if (operations.length > 0) {
  console.log(`Found ${operations.length} changes`);
  notifySubscribers(operations);
} else {
  console.log('No changes detected');
}
```

### Logging Changes

Create human-readable change logs:

```typescript
function logChanges(before: any, after: any) {
  const operations = diff(before, after);

  operations.forEach(op => {
    switch (op.op) {
      case 'add':
        console.log(`➕ Added ${op.path} = ${JSON.stringify(op.value)}`);
        break;
      case 'remove':
        console.log(`➖ Removed ${op.path}`);
        break;
      case 'replace':
        console.log(`✏️  Changed ${op.path} to ${JSON.stringify(op.value)}`);
        break;
    }
  });
}

logChanges(
  { user: { name: "Alice", age: 30 } },
  { user: { name: "Bob", age: 31 } }
);
// ✏️  Changed /user/name to "Bob"
// ✏️  Changed /user/age to 31
```

### Filtering Operations

Filter operations by type or path:

```typescript
const operations = diff(oldState, newState);

// Only additions
const additions = operations.filter(op => op.op === 'add');

// Only removals
const removals = operations.filter(op => op.op === 'remove');

// Changes to user object
const userChanges = operations.filter(op =>
  op.path.startsWith('/user')
);

// Changes to specific property
const nameChange = operations.find(op => op.path === '/user/name');
if (nameChange && nameChange.op === 'replace') {
  console.log(`Name changed to: ${nameChange.value}`);
}
```

## Common Use Cases

### Configuration Management

Track changes to configuration objects:

```typescript
interface AppConfig {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  apiEndpoint: string;
}

const oldConfig: AppConfig = {
  theme: 'light',
  language: 'en',
  notifications: true,
  apiEndpoint: 'https://api.example.com'
};

const newConfig: AppConfig = {
  theme: 'dark',
  language: 'en',
  notifications: true,
  apiEndpoint: 'https://api.example.com'
};

const configChanges = diff(oldConfig, newConfig);

if (configChanges.length > 0) {
  console.log('Configuration updated:');
  configChanges.forEach(op => {
    console.log(`- ${op.path}: ${JSON.stringify(op)}`);
  });

  // Save to audit log
  auditLog.record('config_change', configChanges);
}
```

### Form State Tracking

Track which form fields have changed:

```typescript
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

function FormComponent() {
  const [initialValues, setInitialValues] = useState<FormData>({
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com'
  });

  const [currentValues, setCurrentValues] = useState<FormData>(initialValues);

  const getDirtyFields = () => {
    const changes = diff(initialValues, currentValues);
    return changes.map(op => op.path.substring(1)); // Remove leading '/'
  };

  const handleSubmit = () => {
    const changes = diff(initialValues, currentValues);

    if (changes.length === 0) {
      console.log('No changes to save');
      return;
    }

    // Only send changed fields
    api.patch('/user/profile', changes);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <div>Changed fields: {getDirtyFields().join(', ')}</div>
    </form>
  );
}
```

### Optimistic Updates

Detect conflicts in optimistic UI updates:

```typescript
class OptimisticStore {
  private serverState: any;
  private localState: any;

  async updateField(path: string, value: any) {
    // Save current server state
    const beforeUpdate = { ...this.serverState };

    // Apply optimistic update
    this.localState = { ...this.localState, [path]: value };
    this.render();

    try {
      // Send to server
      const result = await api.update({ [path]: value });
      this.serverState = result;
    } catch (error) {
      // Check for conflicts
      const ourChanges = diff(beforeUpdate, this.localState);
      const serverChanges = diff(beforeUpdate, this.serverState);

      const conflicts = ourChanges.filter(ourOp =>
        serverChanges.some(serverOp => serverOp.path === ourOp.path)
      );

      if (conflicts.length > 0) {
        console.warn('Conflicts detected:', conflicts);
        // Handle conflict resolution
      }

      // Rollback on error
      this.localState = this.serverState;
      this.render();
    }
  }
}
```

## Advanced Examples

### Batch Operations

Accumulate changes over multiple operations:

```typescript
class ChangeTracker {
  private original: any;
  private current: any;
  private operations: Operation[] = [];

  constructor(initialState: any) {
    this.original = initialState;
    this.current = { ...initialState };
  }

  update(changes: Partial<any>) {
    const previous = this.current;
    this.current = { ...this.current, ...changes };

    // Recalculate total diff from original
    this.operations = diff(this.original, this.current);
  }

  getChanges(): Operation[] {
    return this.operations;
  }

  hasChanges(): boolean {
    return this.operations.length > 0;
  }

  reset() {
    this.current = { ...this.original };
    this.operations = [];
  }

  commit() {
    this.original = { ...this.current };
    this.operations = [];
  }
}

// Usage
const tracker = new ChangeTracker({ name: "Alice", age: 30 });

tracker.update({ age: 31 });
tracker.update({ role: "admin" });

console.log(tracker.getChanges());
// [
//   { op: 'replace', path: '/age', value: 31 },
//   { op: 'add', path: '/role', value: 'admin' }
// ]

if (tracker.hasChanges()) {
  await api.save(tracker.getChanges());
  tracker.commit();
}
```

### Change History

Build a complete change history:

```typescript
interface HistoryEntry {
  timestamp: number;
  operations: Operation[];
  author?: string;
}

class VersionHistory {
  private versions: any[] = [];
  private history: HistoryEntry[] = [];

  constructor(initialVersion: any) {
    this.versions.push(initialVersion);
  }

  addVersion(newVersion: any, author?: string) {
    const previous = this.versions[this.versions.length - 1];
    const operations = diff(previous, newVersion);

    if (operations.length > 0) {
      this.versions.push(newVersion);
      this.history.push({
        timestamp: Date.now(),
        operations,
        author
      });
    }
  }

  getHistory(): HistoryEntry[] {
    return this.history;
  }

  getVersion(index: number): any {
    return this.versions[index];
  }

  getCurrentVersion(): any {
    return this.versions[this.versions.length - 1];
  }

  getChangeSummary(): string {
    const total = this.history.reduce(
      (acc, entry) => acc + entry.operations.length,
      0
    );
    return `${this.versions.length} versions, ${total} total changes`;
  }
}

// Usage
const history = new VersionHistory({ title: "Doc", content: "" });

history.addVersion({ title: "Document", content: "" }, "Alice");
history.addVersion({ title: "Document", content: "Hello" }, "Alice");
history.addVersion({ title: "Document", content: "Hello World" }, "Bob");

console.log(history.getChangeSummary());
// "4 versions, 3 total changes"
```

## Use Case Categories

Explore detailed examples for specific use cases:

- **[State Management](/examples/state-management)** - Redux, Zustand, and other state stores
- **[API Responses](/examples/api-responses)** - Efficient API updates and caching
- **[Version Control](/examples/version-control)** - Document history and undo/redo

## Best Practices

### 1. Check for Empty Results

Always check if changes exist before taking action:

```typescript
const operations = diff(old, new);
if (operations.length > 0) {
  // Only proceed if there are actual changes
}
```

### 2. Use TypeScript Types

Leverage TypeScript for type safety:

```typescript
import { Operation, AddOperation } from 'zen-json-patch';

function handleOperations(ops: Operation[]) {
  ops.forEach(op => {
    if (op.op === 'add') {
      // TypeScript knows op is AddOperation
      console.log(op.value);
    }
  });
}
```

### 3. Immutable Data Patterns

Use immutable patterns for best performance:

```typescript
// Good - only changed parts are new
const updated = {
  ...state,
  user: { ...state.user, age: 31 }
};

// Less efficient - everything is new
const updated = JSON.parse(JSON.stringify(state));
updated.user.age = 31;
```

### 4. Batch Related Changes

Group related changes together:

```typescript
// Good - single diff for related changes
const updated = {
  ...user,
  firstName: 'Alice',
  lastName: 'Smith',
  updatedAt: Date.now()
};
const operations = diff(user, updated);

// Less efficient - multiple diffs
const ops1 = diff(user, { ...user, firstName: 'Alice' });
const ops2 = diff(user, { ...user, lastName: 'Smith' });
```

## Next Steps

Explore specific use cases:

- [State Management Examples](/examples/state-management)
- [API Response Examples](/examples/api-responses)
- [Version Control Examples](/examples/version-control)
