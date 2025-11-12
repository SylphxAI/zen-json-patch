# Usage Guide

This guide covers core concepts and common usage patterns for zen-json-patch.

## Core Concepts

### The diff Function

zen-json-patch provides a single function: `diff(obj1, obj2)`. It compares two JSON-compatible objects and returns an array of JSON Patch operations.

```typescript
import { diff } from 'zen-json-patch';

const operations = diff(source, target);
```

- **source** (obj1): The original object
- **target** (obj2): The modified object
- **returns**: Array of operations to transform source into target

### JSON Patch Operations

The `diff` function generates three types of operations:

| Operation | Description | Example |
|-----------|-------------|---------|
| `add` | Adds a new property | `{ op: 'add', path: '/name', value: 'Alice' }` |
| `remove` | Removes a property | `{ op: 'remove', path: '/age' }` |
| `replace` | Changes a value | `{ op: 'replace', path: '/age', value: 31 }` |

## Basic Examples

### Simple Objects

```typescript
import { diff } from 'zen-json-patch';

const before = { name: "Alice", age: 30 };
const after = { name: "Bob", age: 30 };

const operations = diff(before, after);
// [{ op: 'replace', path: '/name', value: 'Bob' }]
```

### Adding Properties

```typescript
const before = { name: "Alice" };
const after = { name: "Alice", role: "admin" };

const operations = diff(before, after);
// [{ op: 'add', path: '/role', value: 'admin' }]
```

### Removing Properties

```typescript
const before = { name: "Alice", age: 30 };
const after = { name: "Alice" };

const operations = diff(before, after);
// [{ op: 'remove', path: '/age' }]
```

### No Changes

```typescript
const obj = { name: "Alice", age: 30 };

const operations = diff(obj, obj);
// [] (empty array - no changes)
```

## Nested Objects

zen-json-patch handles deeply nested objects efficiently:

```typescript
const before = {
  user: {
    profile: {
      name: "Alice",
      settings: {
        theme: "dark",
        notifications: true
      }
    }
  }
};

const after = {
  user: {
    profile: {
      name: "Alice",
      settings: {
        theme: "light",
        notifications: true,
        language: "en"
      }
    }
  }
};

const operations = diff(before, after);
// [
//   { op: 'replace', path: '/user/profile/settings/theme', value: 'light' },
//   { op: 'add', path: '/user/profile/settings/language', value: 'en' }
// ]
```

## Arrays

### Array Element Changes

Arrays are compared element-by-element by index:

```typescript
const before = { items: [1, 2, 3] };
const after = { items: [1, 5, 3] };

const operations = diff(before, after);
// [{ op: 'replace', path: '/items/1', value: 5 }]
```

### Array Length Changes

```typescript
const before = { items: [1, 2, 3] };
const after = { items: [1, 2, 3, 4] };

const operations = diff(before, after);
// [{ op: 'add', path: '/items/3', value: 4 }]
```

### Arrays of Objects

```typescript
const before = {
  users: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ]
};

const after = {
  users: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Robert" }
  ]
};

const operations = diff(before, after);
// [{ op: 'replace', path: '/users/1/name', value: 'Robert' }]
```

::: warning Array Limitations
The current array comparison is naive (element-by-element). It doesn't detect moves or insertions efficiently. For example, inserting an element at the beginning will generate replace operations for all subsequent elements. A more sophisticated array diff algorithm (like Myers diff) is planned for future versions.
:::

## Data Types

### Primitives

All JavaScript primitives are supported:

```typescript
// Numbers
diff({ count: 1 }, { count: 2 })
// [{ op: 'replace', path: '/count', value: 2 }]

// Strings
diff({ name: "old" }, { name: "new" })
// [{ op: 'replace', path: '/name', value: 'new' }]

// Booleans
diff({ active: false }, { active: true })
// [{ op: 'replace', path: '/active', value: true }]

// Null
diff({ value: "something" }, { value: null })
// [{ op: 'replace', path: '/value', value: null }]
```

### Type Changes

When a value changes type, a `replace` operation is generated:

```typescript
diff({ value: 42 }, { value: "forty-two" })
// [{ op: 'replace', path: '/value', value: 'forty-two' }]

diff({ data: [1, 2] }, { data: { a: 1, b: 2 } })
// [{ op: 'replace', path: '/data', value: { a: 1, b: 2 } }]
```

### Null vs Undefined

- `null` is treated as a value
- `undefined` is treated as missing (generates `remove` operation)

```typescript
// Setting to null
diff({ value: "something" }, { value: null })
// [{ op: 'replace', path: '/value', value: null }]

// Removing property (undefined)
diff({ value: "something" }, {})
// [{ op: 'remove', path: '/value' }]
```

## JSON Pointer Paths

Paths use JSON Pointer syntax (RFC 6901):

```typescript
'/'           // Root
'/a'          // Property 'a'
'/a/b'        // Nested property 'b' in 'a'
'/items/0'    // First element of 'items' array
'/items/1/id' // Property 'id' of second array element
```

### Special Characters

Some characters in property names need escaping:

```typescript
// Tilde (~) is escaped as ~0
diff({ "a~b": 1 }, { "a~b": 2 })
// [{ op: 'replace', path: '/a~0b', value: 2 }]

// Slash (/) is escaped as ~1
diff({ "a/b": 1 }, { "a/b": 2 })
// [{ op: 'replace', path: '/a~1b', value: 2 }]
```

See [RFC 6901](/guide/rfc6901) for complete path syntax details.

## Performance Tips

### Early Exit Optimization

zen-json-patch uses strict equality checks for early exits:

```typescript
const obj = { nested: { deep: { value: 1 } } };

// Fast - same reference
diff(obj, obj) // Returns immediately

// Fast - unchanged nested objects reuse references
const updated = { ...obj, newProp: "added" };
diff(obj, updated) // Skips comparison of nested object
```

### Immutable Updates

For best performance, use immutable update patterns:

```typescript
// Good - only changed parts are new objects
const updated = {
  ...original,
  user: {
    ...original.user,
    age: 31 // Only age changed
  }
};

// Less efficient - entire object is new
const updated = JSON.parse(JSON.stringify(original));
updated.user.age = 31;
```

### Large Objects

zen-json-patch is optimized for large objects:

- Set-based key lookups (O(1))
- Early exits for unchanged values
- Minimal recursion overhead

```typescript
// Efficiently handles objects with 1000+ keys
const large = Object.fromEntries(
  Array.from({ length: 1000 }, (_, i) => [`key${i}`, i])
);

const updated = { ...large, key500: 9999 };

const operations = diff(large, updated);
// [{ op: 'replace', path: '/key500', value: 9999 }]
```

## Common Patterns

### Conditional Updates

Check if changes occurred before taking action:

```typescript
const operations = diff(oldData, newData);

if (operations.length > 0) {
  // Changes detected - update cache, notify subscribers, etc.
  console.log(`${operations.length} changes detected`);
} else {
  // No changes - skip unnecessary work
  console.log('No changes');
}
```

### Logging Changes

Track what changed for debugging or auditing:

```typescript
const operations = diff(before, after);

operations.forEach(op => {
  switch (op.op) {
    case 'add':
      console.log(`Added ${op.path} = ${JSON.stringify(op.value)}`);
      break;
    case 'remove':
      console.log(`Removed ${op.path}`);
      break;
    case 'replace':
      console.log(`Changed ${op.path} to ${JSON.stringify(op.value)}`);
      break;
  }
});
```

### Filtering Operations

Filter operations by path or type:

```typescript
const operations = diff(before, after);

// Only user profile changes
const profileChanges = operations.filter(op =>
  op.path.startsWith('/user/profile')
);

// Only additions
const additions = operations.filter(op => op.op === 'add');

// Only specific property
const nameChange = operations.find(op => op.path === '/name');
```

## Next Steps

- [RFC 6902 Guide](/guide/rfc6902) - Understanding JSON Patch specification
- [RFC 6901 Guide](/guide/rfc6901) - JSON Pointer syntax details
- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - Real-world usage patterns
