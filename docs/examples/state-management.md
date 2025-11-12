# State Management

Examples of using zen-json-patch with state management libraries and patterns.

## Redux Integration

Track changes in Redux store state for logging, persistence, or synchronization.

### Basic Redux Middleware

```typescript
import { diff } from 'zen-json-patch';
import { Middleware } from 'redux';

const patchMiddleware: Middleware = store => next => action => {
  const prevState = store.getState();
  const result = next(action);
  const nextState = store.getState();

  const operations = diff(prevState, nextState);

  if (operations.length > 0) {
    console.log(`Action ${action.type} produced ${operations.length} changes`);
    console.log('Changes:', operations);
  }

  return result;
};

// Usage
const store = createStore(
  rootReducer,
  applyMiddleware(patchMiddleware)
);
```

### Selective State Sync

Sync only changed state to server:

```typescript
import { diff, Operation } from 'zen-json-patch';

interface AppState {
  user: User;
  settings: Settings;
  cache: Cache;
}

const syncMiddleware: Middleware<{}, AppState> = store => {
  let lastSyncedState: AppState | null = null;
  let syncTimeout: NodeJS.Timeout;

  return next => action => {
    const result = next(action);

    // Debounce sync
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      const currentState = store.getState();

      if (lastSyncedState) {
        const operations = diff(lastSyncedState, currentState);

        // Filter out cache changes (don't sync cache)
        const syncableOps = operations.filter(
          op => !op.path.startsWith('/cache')
        );

        if (syncableOps.length > 0) {
          syncToServer(syncableOps);
          lastSyncedState = currentState;
        }
      } else {
        // First sync - send full state
        lastSyncedState = currentState;
        syncToServer([{ op: 'replace', path: '', value: currentState }]);
      }
    }, 1000);

    return result;
  };
};

async function syncToServer(operations: Operation[]) {
  try {
    await fetch('/api/state', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operations)
    });
    console.log('State synced successfully');
  } catch (error) {
    console.error('Failed to sync state:', error);
  }
}
```

### Undo/Redo with Redux

Implement undo/redo using patches:

```typescript
import { diff, Operation } from 'zen-json-patch';
import { applyPatch } from 'fast-json-patch';

interface HistoryState<T> {
  past: Operation[][];
  present: T;
  future: Operation[][];
}

function undoable<T>(reducer: (state: T, action: any) => T) {
  const initialState: HistoryState<T> = {
    past: [],
    present: reducer(undefined as any, { type: '@@INIT' }),
    future: []
  };

  return (state = initialState, action: any): HistoryState<T> => {
    switch (action.type) {
      case 'UNDO': {
        if (state.past.length === 0) return state;

        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);

        // Apply inverse patch to go back
        const newPresent = applyPatch(state.present, previous, true).newDocument;

        // Calculate forward patch for redo
        const forwardPatch = diff(newPresent, state.present);

        return {
          past: newPast,
          present: newPresent,
          future: [forwardPatch, ...state.future]
        };
      }

      case 'REDO': {
        if (state.future.length === 0) return state;

        const next = state.future[0];
        const newFuture = state.future.slice(1);

        const newPresent = applyPatch(state.present, next).newDocument;

        return {
          past: [...state.past, next],
          present: newPresent,
          future: newFuture
        };
      }

      default: {
        const newPresent = reducer(state.present, action);

        if (newPresent === state.present) {
          return state;
        }

        const patch = diff(state.present, newPresent);

        return {
          past: [...state.past, patch],
          present: newPresent,
          future: [] // Clear future on new action
        };
      }
    }
  };
}

// Usage
const todoReducer = (state = { todos: [] }, action: any) => {
  // Your reducer logic
  return state;
};

const undoableTodoReducer = undoable(todoReducer);
```

## Zustand Integration

Track changes in Zustand stores.

### Change Tracking Middleware

```typescript
import { diff } from 'zen-json-patch';
import { create } from 'zustand';
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type ChangeLogger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>
) => StateCreator<T, Mps, Mcs>;

const changeLogger: ChangeLogger = (f) => (set, get, store) => {
  return f(
    (partial, replace) => {
      const prevState = get();
      set(partial, replace);
      const nextState = get();

      const operations = diff(prevState, nextState);

      if (operations.length > 0) {
        console.log('State changes:', operations);
      }
    },
    get,
    store
  );
};

// Usage
interface Store {
  count: number;
  user: { name: string; age: number } | null;
  increment: () => void;
  setUser: (user: { name: string; age: number }) => void;
}

const useStore = create<Store>()(
  changeLogger((set) => ({
    count: 0,
    user: null,
    increment: () => set((state) => ({ count: state.count + 1 })),
    setUser: (user) => set({ user })
  }))
);
```

### Selective Persistence

Persist only changed slices to localStorage:

```typescript
import { diff } from 'zen-json-patch';
import { create } from 'zustand';

interface AppStore {
  user: User;
  settings: Settings;
  sessionData: SessionData;
  updateUser: (user: Partial<User>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const useStore = create<AppStore>((set, get) => {
  // Load initial state from localStorage
  const stored = localStorage.getItem('app-state');
  const initial = stored ? JSON.parse(stored) : {};

  let lastPersistedState = initial;

  // Persist changes on every state update
  const persistChanges = () => {
    const currentState = get();

    // Extract persistable state (exclude sessionData)
    const persistable = {
      user: currentState.user,
      settings: currentState.settings
    };

    const operations = diff(lastPersistedState, persistable);

    if (operations.length > 0) {
      localStorage.setItem('app-state', JSON.stringify(persistable));
      lastPersistedState = persistable;
      console.log(`Persisted ${operations.length} changes`);
    }
  };

  return {
    user: initial.user || { name: '', email: '' },
    settings: initial.settings || { theme: 'light' },
    sessionData: { token: null },

    updateUser: (userData) => {
      set((state) => ({
        user: { ...state.user, ...userData }
      }));
      persistChanges();
    },

    updateSettings: (settingsData) => {
      set((state) => ({
        settings: { ...state.settings, ...settingsData }
      }));
      persistChanges();
    }
  };
});
```

## MobX Integration

Track observable changes in MobX stores.

### Reaction-based Change Tracking

```typescript
import { makeAutoObservable, reaction } from 'mobx';
import { diff } from 'zen-json-patch';

class UserStore {
  user = {
    name: '',
    email: '',
    profile: {
      age: 0,
      bio: ''
    }
  };

  constructor() {
    makeAutoObservable(this);

    // Track changes
    let previousState = this.toJSON();

    reaction(
      () => this.toJSON(),
      (currentState) => {
        const operations = diff(previousState, currentState);

        if (operations.length > 0) {
          console.log('User store changes:', operations);

          // Sync to server
          this.syncChanges(operations);
        }

        previousState = currentState;
      }
    );
  }

  updateUser(data: Partial<typeof this.user>) {
    Object.assign(this.user, data);
  }

  updateProfile(data: Partial<typeof this.user.profile>) {
    Object.assign(this.user.profile, data);
  }

  toJSON() {
    return JSON.parse(JSON.stringify(this.user));
  }

  async syncChanges(operations: Operation[]) {
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        body: JSON.stringify(operations)
      });
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  }
}

const userStore = new UserStore();
```

## Recoil Integration

Track atom changes in Recoil.

### Atom Effect for Change Tracking

```typescript
import { atom, AtomEffect } from 'recoil';
import { diff } from 'zen-json-patch';

function changeTrackerEffect<T>(): AtomEffect<T> {
  return ({ onSet, node }) => {
    let previousValue: T | null = null;

    onSet((newValue, oldValue) => {
      if (previousValue !== null) {
        const operations = diff(previousValue, newValue);

        if (operations.length > 0) {
          console.log(`Atom ${node.key} changed:`, operations);
        }
      }

      previousValue = newValue;
    });
  };
}

// Usage
const userState = atom({
  key: 'user',
  default: { name: '', email: '' },
  effects: [changeTrackerEffect()]
});

const settingsState = atom({
  key: 'settings',
  default: { theme: 'light', notifications: true },
  effects: [changeTrackerEffect()]
});
```

## Jotai Integration

Track atom updates in Jotai.

### Store Subscription

```typescript
import { atom, createStore } from 'jotai';
import { diff } from 'zen-json-patch';

const userAtom = atom({ name: 'Alice', age: 30 });

const store = createStore();

// Track changes
let previousValue = store.get(userAtom);

store.sub(userAtom, () => {
  const currentValue = store.get(userAtom);
  const operations = diff(previousValue, currentValue);

  if (operations.length > 0) {
    console.log('User atom changed:', operations);
  }

  previousValue = currentValue;
});

// Update
store.set(userAtom, { name: 'Bob', age: 30 });
// Logs: User atom changed: [{ op: 'replace', path: '/name', value: 'Bob' }]
```

## Custom State Manager

Build a simple state manager with change tracking.

```typescript
import { diff, Operation } from 'zen-json-patch';

type Listener<T> = (state: T, operations: Operation[]) => void;

class StateManager<T> {
  private state: T;
  private listeners: Set<Listener<T>> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  setState(updater: (state: T) => T): void {
    const prevState = this.state;
    this.state = updater(prevState);

    const operations = diff(prevState, this.state);

    if (operations.length > 0) {
      this.listeners.forEach(listener => {
        listener(this.state, operations);
      });
    }
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Usage
interface AppState {
  user: { name: string; age: number };
  todos: string[];
}

const store = new StateManager<AppState>({
  user: { name: 'Alice', age: 30 },
  todos: []
});

// Subscribe to changes
const unsubscribe = store.subscribe((state, operations) => {
  console.log('State changed:', operations);

  // Sync to server
  if (operations.some(op => op.path.startsWith('/user'))) {
    console.log('User data changed, syncing...');
  }
});

// Update state
store.setState(state => ({
  ...state,
  user: { ...state.user, age: 31 }
}));
// Logs: State changed: [{ op: 'replace', path: '/user/age', value: 31 }]

store.setState(state => ({
  ...state,
  todos: [...state.todos, 'New task']
}));
// Logs: State changed: [{ op: 'add', path: '/todos/0', value: 'New task' }]
```

## Best Practices

### 1. Debounce Expensive Operations

Don't sync on every state change:

```typescript
let syncTimeout: NodeJS.Timeout;

const debouncedSync = (operations: Operation[]) => {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncToServer(operations);
  }, 1000);
};
```

### 2. Filter Sensitive Data

Don't track or sync sensitive state:

```typescript
const operations = diff(prevState, nextState);

const safeOps = operations.filter(
  op => !op.path.startsWith('/password') &&
        !op.path.startsWith('/token')
);
```

### 3. Batch Related Updates

Group related state changes:

```typescript
// Good - single update
store.setState(state => ({
  ...state,
  user: {
    ...state.user,
    name: 'Alice',
    age: 31,
    updatedAt: Date.now()
  }
}));

// Less efficient - multiple updates
store.setState(state => ({ ...state, user: { ...state.user, name: 'Alice' } }));
store.setState(state => ({ ...state, user: { ...state.user, age: 31 } }));
```

## Next Steps

- [API Response Examples](/examples/api-responses)
- [Version Control Examples](/examples/version-control)
- [Usage Guide](/guide/usage)
