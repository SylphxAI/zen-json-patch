# Version Control Examples

Examples of using zen-json-patch for version control, document history, and undo/redo functionality.

## Document History

Track changes to documents over time.

### Version History System

```typescript
import { diff, Operation } from 'zen-json-patch';
import { applyPatch } from 'fast-json-patch';

interface Version<T> {
  id: string;
  timestamp: number;
  author: string;
  message: string;
  patch: Operation[];
}

class DocumentHistory<T> {
  private versions: Version<T>[] = [];
  private currentDocument: T;

  constructor(initialDocument: T, author: string) {
    this.currentDocument = initialDocument;

    // Create initial version
    this.versions.push({
      id: this.generateId(),
      timestamp: Date.now(),
      author,
      message: 'Initial version',
      patch: []
    });
  }

  commit(newDocument: T, author: string, message: string): string {
    const patch = diff(this.currentDocument, newDocument);

    if (patch.length === 0) {
      throw new Error('No changes to commit');
    }

    const version: Version<T> = {
      id: this.generateId(),
      timestamp: Date.now(),
      author,
      message,
      patch
    };

    this.versions.push(version);
    this.currentDocument = newDocument;

    return version.id;
  }

  getVersion(versionId: string): T | null {
    const versionIndex = this.versions.findIndex(v => v.id === versionId);

    if (versionIndex === -1) {
      return null;
    }

    // Reconstruct document at this version
    let document = this.versions[0].patch.length === 0
      ? this.currentDocument
      : {} as T;

    for (let i = 1; i <= versionIndex; i++) {
      const { newDocument } = applyPatch(document, this.versions[i].patch);
      document = newDocument;
    }

    return document;
  }

  getCurrentVersion(): T {
    return this.currentDocument;
  }

  getHistory(): Array<Omit<Version<T>, 'patch'>> {
    return this.versions.map(v => ({
      id: v.id,
      timestamp: v.timestamp,
      author: v.author,
      message: v.message
    }));
  }

  getDiff(fromVersionId: string, toVersionId: string): Operation[] {
    const fromDoc = this.getVersion(fromVersionId);
    const toDoc = this.getVersion(toVersionId);

    if (!fromDoc || !toDoc) {
      throw new Error('Invalid version IDs');
    }

    return diff(fromDoc, toDoc);
  }

  private generateId(): string {
    return `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage
interface Document {
  title: string;
  content: string;
  tags: string[];
}

const history = new DocumentHistory<Document>(
  { title: 'Untitled', content: '', tags: [] },
  'alice@example.com'
);

// Make changes
history.commit(
  { title: 'My Document', content: '', tags: [] },
  'alice@example.com',
  'Added title'
);

history.commit(
  { title: 'My Document', content: 'Hello world', tags: ['draft'] },
  'alice@example.com',
  'Added content and draft tag'
);

history.commit(
  { title: 'My Document', content: 'Hello world!', tags: ['draft', 'public'] },
  'bob@example.com',
  'Fixed typo and published'
);

// View history
console.log(history.getHistory());
// [
//   { id: 'v1...', timestamp: 1234567890, author: 'alice@...', message: 'Initial version' },
//   { id: 'v2...', timestamp: 1234567891, author: 'alice@...', message: 'Added title' },
//   { id: 'v3...', timestamp: 1234567892, author: 'alice@...', message: 'Added content...' },
//   { id: 'v4...', timestamp: 1234567893, author: 'bob@...', message: 'Fixed typo...' }
// ]

// Get specific version
const version2 = history.getVersion('v2...');
console.log(version2);
// { title: 'My Document', content: '', tags: [] }

// Compare versions
const changes = history.getDiff('v2...', 'v4...');
console.log(changes);
// [
//   { op: 'replace', path: '/content', value: 'Hello world!' },
//   { op: 'add', path: '/tags/0', value: 'draft' },
//   { op: 'add', path: '/tags/1', value: 'public' }
// ]
```

## Undo/Redo

Implement undo/redo functionality.

### Basic Undo/Redo

```typescript
import { diff, Operation } from 'zen-json-patch';
import { applyPatch } from 'fast-json-patch';

class UndoRedoManager<T> {
  private past: Operation[][] = [];
  private future: Operation[][] = [];
  private current: T;

  constructor(initialState: T) {
    this.current = initialState;
  }

  execute(newState: T): void {
    const operations = diff(this.current, newState);

    if (operations.length === 0) {
      return; // No changes
    }

    this.past.push(operations);
    this.future = []; // Clear redo stack
    this.current = newState;
  }

  undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }

    const operations = this.past.pop()!;

    // Calculate reverse patch
    const previousState = this.calculatePreviousState(operations);

    // Save forward patch for redo
    this.future.push(operations);

    this.current = previousState;
    return this.current;
  }

  redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }

    const operations = this.future.pop()!;
    const { newDocument } = applyPatch(this.current, operations);

    this.past.push(operations);
    this.current = newDocument;

    return this.current;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getCurrent(): T {
    return this.current;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }

  private calculatePreviousState(operations: Operation[]): T {
    // Create reverse operations
    const reverseOps: Operation[] = operations.map(op => {
      if (op.op === 'add') {
        return { op: 'remove', path: op.path };
      } else if (op.op === 'remove') {
        // Note: We'd need to store the removed value to properly reverse
        throw new Error('Cannot reverse remove operation without stored value');
      } else if (op.op === 'replace') {
        // Note: We'd need to store the old value to properly reverse
        throw new Error('Cannot reverse replace operation without stored value');
      }
      return op;
    }).reverse();

    const { newDocument } = applyPatch(this.current, reverseOps);
    return newDocument;
  }
}

// Better implementation with stored states
class UndoRedoManagerWithStates<T> {
  private past: T[] = [];
  private future: T[] = [];
  private current: T;
  private maxHistory: number;

  constructor(initialState: T, maxHistory = 50) {
    this.current = initialState;
    this.maxHistory = maxHistory;
  }

  execute(newState: T): void {
    const operations = diff(this.current, newState);

    if (operations.length === 0) {
      return;
    }

    this.past.push(this.current);
    this.future = [];
    this.current = newState;

    // Limit history size
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
  }

  undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }

    this.future.push(this.current);
    this.current = this.past.pop()!;

    return this.current;
  }

  redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }

    this.past.push(this.current);
    this.current = this.future.pop()!;

    return this.current;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getCurrent(): T {
    return this.current;
  }

  getHistory(): { past: number; future: number } {
    return {
      past: this.past.length,
      future: this.future.length
    };
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}

// Usage
interface TextDocument {
  content: string;
  cursor: number;
}

const undoRedo = new UndoRedoManagerWithStates<TextDocument>(
  { content: '', cursor: 0 }
);

// Type some text
undoRedo.execute({ content: 'H', cursor: 1 });
undoRedo.execute({ content: 'He', cursor: 2 });
undoRedo.execute({ content: 'Hel', cursor: 3 });
undoRedo.execute({ content: 'Hell', cursor: 4 });
undoRedo.execute({ content: 'Hello', cursor: 5 });

console.log(undoRedo.getCurrent());
// { content: 'Hello', cursor: 5 }

// Undo
undoRedo.undo();
console.log(undoRedo.getCurrent());
// { content: 'Hell', cursor: 4 }

undoRedo.undo();
console.log(undoRedo.getCurrent());
// { content: 'Hel', cursor: 3 }

// Redo
undoRedo.redo();
console.log(undoRedo.getCurrent());
// { content: 'Hell', cursor: 4 }
```

## Change Tracking

Track who changed what and when.

### Audit Log

```typescript
import { diff, Operation } from 'zen-json-patch';

interface AuditEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  operations: Operation[];
  metadata?: Record<string, any>;
}

class AuditLog<T> {
  private entries: AuditEntry[] = [];
  private currentState: T;

  constructor(initialState: T) {
    this.currentState = initialState;
  }

  update(
    newState: T,
    userId: string,
    userName: string,
    metadata?: Record<string, any>
  ): void {
    const operations = diff(this.currentState, newState);

    if (operations.length === 0) {
      return;
    }

    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      userId,
      userName,
      operations,
      metadata
    };

    this.entries.push(entry);
    this.currentState = newState;
  }

  getEntries(filters?: {
    userId?: string;
    startDate?: number;
    endDate?: number;
    path?: string;
  }): AuditEntry[] {
    let filtered = this.entries;

    if (filters?.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
    }

    if (filters?.path) {
      filtered = filtered.filter(e =>
        e.operations.some(op => op.path.startsWith(filters.path!))
      );
    }

    return filtered;
  }

  getChangesBy(userId: string): Operation[] {
    return this.entries
      .filter(e => e.userId === userId)
      .flatMap(e => e.operations);
  }

  getChangesTo(path: string): AuditEntry[] {
    return this.entries.filter(e =>
      e.operations.some(op => op.path === path || op.path.startsWith(path + '/'))
    );
  }

  exportLog(): string {
    return this.entries.map(entry => {
      const date = new Date(entry.timestamp).toISOString();
      const changes = entry.operations.length;
      return `[${date}] ${entry.userName} made ${changes} change(s)`;
    }).join('\n');
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage
interface UserProfile {
  name: string;
  email: string;
  role: string;
  settings: {
    theme: string;
    notifications: boolean;
  };
}

const audit = new AuditLog<UserProfile>({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user',
  settings: { theme: 'light', notifications: true }
});

// Track changes
audit.update(
  {
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
    settings: { theme: 'light', notifications: true }
  },
  'user-123',
  'Admin User',
  { reason: 'Promotion' }
);

audit.update(
  {
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
    settings: { theme: 'dark', notifications: false }
  },
  'user-456',
  'Alice',
  { reason: 'User preference' }
);

// Query audit log
const allChanges = audit.getEntries();
console.log(allChanges);

// Changes by specific user
const aliceChanges = audit.getChangesBy('user-456');
console.log('Alice changed:', aliceChanges);

// Changes to specific field
const roleChanges = audit.getChangesTo('/role');
console.log('Role changes:', roleChanges);

// Export log
console.log(audit.exportLog());
// [2024-01-01T12:00:00.000Z] Admin User made 1 change(s)
// [2024-01-01T12:05:00.000Z] Alice made 2 change(s)
```

## Branching and Merging

Implement Git-like branching.

### Simple Branching System

```typescript
import { diff, Operation } from 'zen-json-patch';
import { applyPatch } from 'fast-json-patch';

interface Commit<T> {
  id: string;
  parentId: string | null;
  state: T;
  message: string;
  author: string;
  timestamp: number;
}

class VersionControl<T> {
  private commits = new Map<string, Commit<T>>();
  private branches = new Map<string, string>(); // branch name -> commit id
  private currentBranch = 'main';

  constructor(initialState: T, author: string) {
    const commit = this.createCommit(null, initialState, 'Initial commit', author);
    this.branches.set('main', commit.id);
  }

  commit(newState: T, message: string, author: string): string {
    const currentCommit = this.getCurrentCommit();
    const operations = diff(currentCommit.state, newState);

    if (operations.length === 0) {
      throw new Error('No changes to commit');
    }

    const commit = this.createCommit(currentCommit.id, newState, message, author);
    this.branches.set(this.currentBranch, commit.id);

    return commit.id;
  }

  branch(branchName: string): void {
    if (this.branches.has(branchName)) {
      throw new Error(`Branch ${branchName} already exists`);
    }

    const currentCommitId = this.branches.get(this.currentBranch)!;
    this.branches.set(branchName, currentCommitId);
  }

  checkout(branchName: string): T {
    if (!this.branches.has(branchName)) {
      throw new Error(`Branch ${branchName} does not exist`);
    }

    this.currentBranch = branchName;
    return this.getCurrentCommit().state;
  }

  merge(sourceBranch: string): { success: boolean; conflicts?: string[] } {
    if (!this.branches.has(sourceBranch)) {
      throw new Error(`Branch ${sourceBranch} does not exist`);
    }

    const targetCommit = this.getCurrentCommit();
    const sourceCommitId = this.branches.get(sourceBranch)!;
    const sourceCommit = this.commits.get(sourceCommitId)!;

    // Find common ancestor
    const commonAncestor = this.findCommonAncestor(
      targetCommit.id,
      sourceCommit.id
    );

    if (!commonAncestor) {
      return { success: false, conflicts: ['No common ancestor'] };
    }

    const ancestorState = this.commits.get(commonAncestor)!.state;

    // Calculate changes from both branches
    const targetChanges = diff(ancestorState, targetCommit.state);
    const sourceChanges = diff(ancestorState, sourceCommit.state);

    // Detect conflicts
    const conflicts: string[] = [];
    const conflictPaths = new Set<string>();

    targetChanges.forEach(targetOp => {
      sourceChanges.forEach(sourceOp => {
        if (targetOp.path === sourceOp.path) {
          conflictPaths.add(targetOp.path);
          conflicts.push(targetOp.path);
        }
      });
    });

    if (conflicts.length > 0) {
      return { success: false, conflicts };
    }

    // No conflicts - apply source changes to target
    const { newDocument } = applyPatch(targetCommit.state, sourceChanges);

    this.commit(
      newDocument,
      `Merge ${sourceBranch} into ${this.currentBranch}`,
      'system'
    );

    return { success: true };
  }

  getHistory(branchName?: string): Commit<T>[] {
    const branch = branchName || this.currentBranch;
    const commitId = this.branches.get(branch);

    if (!commitId) {
      return [];
    }

    const history: Commit<T>[] = [];
    let currentId: string | null = commitId;

    while (currentId) {
      const commit = this.commits.get(currentId)!;
      history.push(commit);
      currentId = commit.parentId;
    }

    return history;
  }

  private getCurrentCommit(): Commit<T> {
    const commitId = this.branches.get(this.currentBranch)!;
    return this.commits.get(commitId)!;
  }

  private createCommit(
    parentId: string | null,
    state: T,
    message: string,
    author: string
  ): Commit<T> {
    const commit: Commit<T> = {
      id: this.generateId(),
      parentId,
      state,
      message,
      author,
      timestamp: Date.now()
    };

    this.commits.set(commit.id, commit);
    return commit;
  }

  private findCommonAncestor(commit1Id: string, commit2Id: string): string | null {
    const ancestors1 = new Set<string>();
    let current: string | null = commit1Id;

    while (current) {
      ancestors1.add(current);
      const commit = this.commits.get(current)!;
      current = commit.parentId;
    }

    current = commit2Id;
    while (current) {
      if (ancestors1.has(current)) {
        return current;
      }
      const commit = this.commits.get(current)!;
      current = commit.parentId;
    }

    return null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Usage
interface Project {
  name: string;
  version: string;
  features: string[];
}

const vc = new VersionControl<Project>(
  { name: 'MyApp', version: '1.0.0', features: [] },
  'alice@example.com'
);

// Commit on main
vc.commit(
  { name: 'MyApp', version: '1.0.0', features: ['auth'] },
  'Add authentication',
  'alice@example.com'
);

// Create feature branch
vc.branch('feature/dark-mode');
vc.checkout('feature/dark-mode');

// Work on feature branch
vc.commit(
  { name: 'MyApp', version: '1.0.0', features: ['auth', 'dark-mode'] },
  'Add dark mode',
  'bob@example.com'
);

// Switch back to main
vc.checkout('main');

// Merge feature branch
const result = vc.merge('feature/dark-mode');

if (result.success) {
  console.log('Merge successful!');
} else {
  console.log('Merge conflicts:', result.conflicts);
}
```

## Best Practices

### 1. Limit History Size

Prevent memory issues with large histories:

```typescript
class LimitedHistory<T> {
  private maxEntries = 100;
  private entries: Array<{ state: T; timestamp: number }> = [];

  add(state: T): void {
    this.entries.push({ state, timestamp: Date.now() });

    if (this.entries.length > this.maxEntries) {
      this.entries.shift(); // Remove oldest
    }
  }
}
```

### 2. Compress Old Versions

Store diffs instead of full states for old versions:

```typescript
interface CompressedVersion<T> {
  id: string;
  fullState?: T;  // Only for recent versions
  patch?: Operation[];  // For older versions
}
```

### 3. Add Timestamps

Always include timestamps for audit trails:

```typescript
interface VersionedDocument<T> {
  data: T;
  version: number;
  createdAt: number;
  updatedAt: number;
  author: string;
}
```

## Next Steps

- [State Management Examples](/examples/state-management)
- [API Response Examples](/examples/api-responses)
- [Usage Guide](/guide/usage)
