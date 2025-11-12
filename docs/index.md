---
layout: home

hero:
  name: "zen-json-patch"
  text: "Monstrously Fast JSON Patch"
  tagline: RFC 6902 compliant • Type-safe • Zero dependencies
  image:
    src: /logo.svg
    alt: zen-json-patch
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/SylphxAI/zen-json-patch

features:
  - icon: ⚡
    title: Blazing Fast
    details: Optimized diff algorithm with smart object handling and early exits. Significantly faster than existing libraries, especially for large objects.

  - icon: 📦
    title: Zero Dependencies
    details: Pure TypeScript implementation with no runtime dependencies. Smaller bundle size and fewer security concerns.

  - icon: 🔒
    title: Type-Safe
    details: Full TypeScript support with strict types. Catch errors at compile time, not runtime.

  - icon: 📐
    title: RFC 6902 Compliant
    details: Generates standard JSON Patch operations. Compatible with any RFC 6902 compliant library.

  - icon: 🧪
    title: Well Tested
    details: Comprehensive test suite covering edge cases, nested objects, arrays, and RFC compliance.

  - icon: 🎯
    title: Simple API
    details: Single function API - just call diff(obj1, obj2). No complex configuration needed.
---

## Quick Example

```typescript
import { diff } from 'zen-json-patch';

const before = {
  user: { name: "Alice", age: 30 }
};

const after = {
  user: { name: "Alice", age: 31, role: "admin" }
};

const patch = diff(before, after);
// [
//   { op: 'replace', path: '/user/age', value: 31 },
//   { op: 'add', path: '/user/role', value: 'admin' }
// ]
```

## Performance Highlights

zen-json-patch is designed for speed:

- **O(1) key lookups** - Set-based key existence checks
- **Early exits** - Strict equality checks before deep comparison
- **Optimized recursion** - Minimal overhead for nested structures
- **Zero dependencies** - No bloat, just pure TypeScript

### Benchmark Results

| Operation | zen-json-patch | fast-json-patch | just-diff |
|-----------|----------------|-----------------|-----------|
| Simple objects | ⚡ **Fastest** | ✅ Good | ✅ Good |
| Nested objects | ⚡ **Fastest** | ✅ Good | ⚠️ Slower |
| Large objects (1000+ keys) | ⚡ **Fastest** | ⚠️ Slower | ⚠️ Slower |

[See detailed benchmarks →](/performance)

## Why zen-json-patch?

**Traditional JSON diff libraries** are often slow, have heavy dependencies, or lack TypeScript support.

**zen-json-patch** solves these problems:

- **Fast** - Optimized for performance without sacrificing correctness
- **Lightweight** - Zero runtime dependencies
- **Modern** - Built with TypeScript for TypeScript projects
- **Standard** - RFC 6902 compliant, works with any patch library

## Use Cases

- **State Management** - Track changes in Redux, Zustand, or other state stores
- **API Responses** - Send incremental updates instead of full payloads
- **Version Control** - Build change history and undo/redo functionality
- **Real-time Sync** - Minimize data transfer in collaborative applications
- **Caching** - Update cached data efficiently

## Installation

```bash
npm install zen-json-patch
```

[Get Started →](/guide/)

## Community

- [GitHub](https://github.com/SylphxAI/zen-json-patch) - Source code and issues
- [npm](https://www.npmjs.com/package/zen-json-patch) - Package registry
- [Twitter](https://x.com/SylphxAI) - Updates and announcements

## License

MIT © [Sylphx](https://sylphx.com)
