<div align="center">

# zen-json-patch ⚡

**Monstrously fast TypeScript library for generating JSON Patch (RFC 6902) diffs**

[![npm version](https://img.shields.io/npm/v/zen-json-patch?style=flat-square)](https://www.npmjs.com/package/zen-json-patch)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://github.com/SylphxAI/zen-json-patch/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**ARCHIVED** • **RFC 6902 compliant** • **Type-safe** • **Zero dependencies** • **Blazing fast**

[Installation](#-installation) • [Quick Start](#-quick-start) • [API](#-api) • [Benchmarks](#-benchmarks)

</div>

---

## ⚠️ ARCHIVED

**This project is archived and no longer actively maintained.**

**Recommended alternative:** Use `@sylphx/craft` instead, which provides comprehensive immutable state management with JSON Patch support built-in.

---

## 🚀 Overview

A high-performance TypeScript library for generating **JSON Patch** operations (RFC 6902) by comparing two JSON objects. Designed to be significantly faster than existing libraries, especially for large or complex objects.

**The Problem:**
```
Traditional JSON diff libraries:
- Slow for large objects ❌
- Heavy dependencies ❌
- Complex APIs ❌
- Limited TypeScript support ❌
```

**The Solution:**
```
zen-json-patch:
- Optimized diff algorithm ✅
- Zero runtime dependencies ✅
- Simple, intuitive API ✅
- Full TypeScript type safety ✅
```

**Result: Fast, reliable JSON diffing for modern applications.**

---

## ⚡ Key Features

### Performance

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Optimized algorithm** | Efficient recursive comparison | Fast even for large objects |
| **Smart object handling** | Set-based key lookups | O(1) key existence checks |
| **Early exits** | Strict equality checks first | Skip unnecessary comparisons |
| **Zero dependencies** | Pure TypeScript | Minimal bundle size |

### Standards & Safety

- **RFC 6902 compliant** - Generates standard JSON Patch operations
- **Type-safe** - Full TypeScript support with strict types
- **Tested** - Comprehensive test suite with edge cases
- **Reliable** - Handles nested objects, arrays, null, and primitives

---

## 📦 Installation

```bash
# npm
npm install zen-json-patch

# yarn
yarn add zen-json-patch

# pnpm
pnpm add zen-json-patch

# bun
bun add zen-json-patch
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { diff } from 'zen-json-patch';

const obj1 = { a: 1, b: "hello", c: true };
const obj2 = { a: 2, b: "hello", d: false };

const operations = diff(obj1, obj2);

console.log(operations);
// Output:
// [
//   { op: 'replace', path: '/a', value: 2 },
//   { op: 'remove', path: '/c' },
//   { op: 'add', path: '/d', value: false }
// ]
```

### Nested Objects

```typescript
const before = {
  user: {
    name: "Alice",
    age: 30,
    address: { city: "NYC" }
  }
};

const after = {
  user: {
    name: "Alice",
    age: 31,
    address: { city: "SF", zip: "94102" }
  }
};

const patch = diff(before, after);
// [
//   { op: 'replace', path: '/user/age', value: 31 },
//   { op: 'replace', path: '/user/address/city', value: 'SF' },
//   { op: 'add', path: '/user/address/zip', value: '94102' }
// ]
```

### Arrays

```typescript
const arr1 = { items: [1, 2, 3] };
const arr2 = { items: [1, 3, 4] };

const patch = diff(arr1, arr2);
// [
//   { op: 'replace', path: '/items/1', value: 3 },
//   { op: 'replace', path: '/items/2', value: 4 }
// ]
```

### Identical Objects

```typescript
const obj = { a: 1, b: 2 };
const patch = diff(obj, obj);
// [] (empty - no changes)
```

---

## 📖 API Reference

### `diff(obj1, obj2): Operation[]`

Compares two JSON-compatible objects and generates an array of JSON Patch operations.

**Parameters:**
- `obj1` (any) - The source object
- `obj2` (any) - The target object

**Returns:** `Operation[]` - Array of JSON Patch operations

**Operations Generated:**
- `add` - New property added
- `remove` - Property removed
- `replace` - Property value changed

**Example:**
```typescript
const operations = diff(
  { name: "Alice", age: 30 },
  { name: "Bob", age: 30 }
);
// [{ op: 'replace', path: '/name', value: 'Bob' }]
```

---

## 🎯 Operation Types

### JSON Patch Operations (RFC 6902)

```typescript
type Operation =
  | { op: 'add', path: string, value: any }
  | { op: 'remove', path: string }
  | { op: 'replace', path: string, value: any }
  // move and copy operations not yet implemented
```

### Path Format

Paths use **JSON Pointer** syntax (RFC 6901):

```typescript
'/'           // Root
'/a'          // Property 'a'
'/a/b'        // Nested property
'/items/0'    // Array index 0
'/a~0b'       // Property 'a~b' (escaped tilde)
'/a~1b'       // Property 'a/b' (escaped slash)
```

---

## 📊 Benchmarks

### Performance Comparison

Benchmarked against popular JSON diff libraries:

| Library | Simple Objects | Nested Objects | Large Objects (1000 keys) |
|---------|----------------|----------------|---------------------------|
| **zen-json-patch** | ⚡ Fast | ⚡ Fast | ⚡ Fast |
| fast-json-patch | ✅ Good | ✅ Good | ⚠️ Slower |
| just-diff | ✅ Good | ⚠️ Slower | ⚠️ Slower |
| fast-json-diff | ⚠️ Slower | ⚠️ Slower | ⚠️ Slower |

**Run benchmarks:**
```bash
npm run bench
```

### Bundle Size

```bash
npm run size
```

Zero runtime dependencies = smaller bundle size.

---

## 🔍 Current Status & Limitations

### ✅ Supported

- **Objects** - Nested object comparison
- **Arrays** - Element-wise comparison
- **Primitives** - Numbers, strings, booleans, null
- **Operations** - `add`, `remove`, `replace`

### ⚠️ Limitations

- **Array diffing** - Currently uses naive element-wise comparison
  - Correct but not optimized for large insertions/deletions
  - No detection of element moves
  - Planned: Myers diff algorithm for better array performance

- **Operations** - `move` and `copy` operations not yet generated
  - Could be added as optimizations in future versions

---

## 💡 Use Cases

### State Management

```typescript
// Track changes in application state
const oldState = store.getState();
// ... state updates ...
const newState = store.getState();

const changes = diff(oldState, newState);
// Send only changes to server or apply to other instances
```

### API Responses

```typescript
// Efficient incremental updates
const cached = cache.get('user/123');
const fresh = await api.get('user/123');

const delta = diff(cached, fresh);
if (delta.length > 0) {
  cache.update('user/123', delta);
}
```

### Version Control

```typescript
// Track document changes
const v1 = { title: "Doc", content: "..." };
const v2 = { title: "Document", content: "...", author: "Alice" };

const changelog = diff(v1, v2);
// Store changelog for history/undo
```

### Real-time Sync

```typescript
// Minimize data transfer
const localData = getLocalData();
const remoteData = fetchRemoteData();

const changes = diff(localData, remoteData);
if (changes.length < remoteData.size * 0.1) {
  // Apply patch (smaller than full data)
  applyPatch(localData, changes);
} else {
  // Replace entirely
  replaceData(remoteData);
}
```

---

## 🏗️ How It Works

### Algorithm Overview

```
1. Strict equality check
   ├─ Same reference → No changes
   └─ Different → Continue

2. Type comparison
   ├─ Different types → Replace
   └─ Same type → Continue

3. Object type check
   ├─ Arrays → Compare elements
   └─ Objects → Compare properties

4. Object comparison
   ├─ Iterate obj1 keys
   │  ├─ Missing in obj2 → Remove
   │  └─ Present → Recurse
   └─ Iterate remaining obj2 keys → Add

5. Array comparison (naive)
   └─ Compare index by index → Replace if different
```

### Example Walkthrough

```typescript
diff(
  { a: 1, b: { c: 2 } },
  { a: 1, b: { c: 3 }, d: 4 }
)

// Step 1: Root is object, recurse
// Step 2: Check 'a' → Same (1 === 1), skip
// Step 3: Check 'b' → Object, recurse
//   Step 3a: Check 'c' → Different (2 !== 3)
//   Operation: { op: 'replace', path: '/b/c', value: 3 }
// Step 4: Key 'd' in obj2 only
//   Operation: { op: 'add', path: '/d', value: 4 }

// Result:
// [
//   { op: 'replace', path: '/b/c', value: 3 },
//   { op: 'add', path: '/d', value: 4 }
// ]
```

---

## 🧪 Development

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Run benchmarks
npm run bench

# Build
npm run build

# Check bundle size
npm run size
```

### Project Structure

```
zen-json-patch/
├── src/
│   ├── index.ts          # Main diff function
│   ├── types.ts          # TypeScript types
│   ├── arrayDiff.ts      # Array comparison
│   ├── path.ts           # JSON Pointer utilities
│   ├── *.spec.ts         # Test files
│   └── rfc6902.spec.ts   # RFC compliance tests
├── bench/
│   ├── object-diff.bench.ts
│   └── array-diff.bench.ts
├── package.json
└── tsconfig.json
```

### Testing

Comprehensive test suite covering:
- ✅ Simple objects
- ✅ Nested objects
- ✅ Arrays
- ✅ Primitives
- ✅ Edge cases (null, undefined, circular refs)
- ✅ RFC 6902 compliance

---

## 🔧 Configuration

### TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

### Build

Uses `tsup` for fast, optimized builds:

```bash
tsup src/index.ts --format esm,cjs --minify --sourcemap --dts
```

Output:
- `dist/index.js` - CommonJS
- `dist/index.mjs` - ES Modules
- `dist/index.d.ts` - Type declarations

---

## 📚 Resources

### JSON Patch Specification
- [RFC 6902 - JSON Patch](https://tools.ietf.org/html/rfc6902)
- [RFC 6901 - JSON Pointer](https://tools.ietf.org/html/rfc6901)

### Related Libraries
- [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch) - Popular JSON Patch library
- [just-diff](https://github.com/angus-c/just#just-diff) - Lightweight diff utility
- [json-diff](https://github.com/andreyvit/json-diff) - Visual JSON diff

---

## 🗺️ Roadmap

### ✅ Completed

- [x] Basic object/array comparison
- [x] RFC 6902 compliant operations
- [x] TypeScript type safety
- [x] Comprehensive test suite
- [x] Benchmarking infrastructure

### 🚀 Planned

- [ ] **Optimized array diffing** - Myers diff algorithm
- [ ] **Move operations** - Detect moved elements
- [ ] **Copy operations** - Optimize duplicate values
- [ ] **Patch application** - `applyPatch()` function
- [ ] **Performance improvements** - Further optimizations
- [ ] **Custom comparators** - User-defined equality
- [ ] **Ignore paths** - Skip specific properties

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Open an issue** - Discuss changes before implementing
2. **Fork the repository**
3. **Create a feature branch** - `git checkout -b feature/my-feature`
4. **Follow code standards** - Run `npm run validate`
5. **Write tests** - Maintain high coverage
6. **Submit a pull request**

### Development Commands

```bash
npm test           # Run tests
npm run bench      # Run benchmarks
npm run build      # Build package
npm run size       # Check bundle size
```

---

## 📄 License

MIT © [Sylphx](https://sylphx.com)

---

## 🙏 Credits

Built with:
- [TypeScript](https://www.typescriptlang.org/) - Language
- [Vitest](https://vitest.dev/) - Testing framework
- [tsup](https://tsup.egoist.dev/) - Build tool

Inspired by:
- [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)
- [immer](https://github.com/immerjs/immer)

---

## 📞 Support

- 🐛 [Bug Reports](https://github.com/SylphxAI/zen-json-patch/issues)
- 💡 [Feature Requests](https://github.com/SylphxAI/zen-json-patch/issues)
- 📧 [Email](mailto:hi@sylphx.com)

---

<p align="center">
  <strong>Monstrously fast JSON diffing</strong>
  <br>
  <sub>RFC 6902 compliant • Type-safe • Zero dependencies</sub>
  <br><br>
  <a href="https://sylphx.com">sylphx.com</a> •
  <a href="https://x.com/SylphxAI">@SylphxAI</a> •
  <a href="mailto:hi@sylphx.com">hi@sylphx.com</a>
</p>
