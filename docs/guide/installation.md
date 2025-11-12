# Installation

## Package Managers

zen-json-patch is available on npm and can be installed using any modern JavaScript package manager.

### npm

```bash
npm install zen-json-patch
```

### Yarn

```bash
yarn add zen-json-patch
```

### pnpm

```bash
pnpm add zen-json-patch
```

### Bun

```bash
bun add zen-json-patch
```

## Requirements

- **Node.js**: 16.x or higher (ES2020 support)
- **TypeScript**: 4.5 or higher (if using TypeScript)

## Package Details

### Module Formats

zen-json-patch is distributed in multiple module formats:

- **ESM** (ES Modules): `dist/index.mjs`
- **CJS** (CommonJS): `dist/index.js`
- **TypeScript Declarations**: `dist/index.d.ts`

The package.json specifies the appropriate entry points, so your bundler will automatically use the correct format.

### Bundle Size

zen-json-patch has **zero runtime dependencies**, resulting in a minimal bundle size:

- **Minified**: ~2KB
- **Gzipped**: ~1KB

Check the current size:

```bash
npm run size
```

## Importing

### ES Modules (Recommended)

```typescript
import { diff } from 'zen-json-patch';

const operations = diff(obj1, obj2);
```

### CommonJS

```javascript
const { diff } = require('zen-json-patch');

const operations = diff(obj1, obj2);
```

### TypeScript

TypeScript declarations are included automatically:

```typescript
import { diff, Operation, AddOperation, RemoveOperation, ReplaceOperation } from 'zen-json-patch';

// Full type safety
const operations: Operation[] = diff(before, after);
```

## Verification

After installation, verify that zen-json-patch is working correctly:

```typescript
import { diff } from 'zen-json-patch';

const result = diff({ a: 1 }, { a: 2 });
console.log(result);
// [{ op: 'replace', path: '/a', value: 2 }]
```

If you see the expected output, you're all set!

## Browser Support

zen-json-patch works in all modern browsers that support ES2020:

- Chrome 80+
- Firefox 74+
- Safari 14+
- Edge 80+

### Using with Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // No special configuration needed
});
```

### Using with Webpack

```javascript
// webpack.config.js
module.exports = {
  // No special configuration needed
  resolve: {
    extensions: ['.js', '.ts']
  }
};
```

### Using with esbuild

```javascript
// esbuild.config.js
require('esbuild').build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  // No special configuration needed
});
```

## CDN Usage

For quick prototyping, you can load zen-json-patch directly from a CDN:

### ESM.sh

```html
<script type="module">
  import { diff } from 'https://esm.sh/zen-json-patch';

  const operations = diff({ a: 1 }, { a: 2 });
  console.log(operations);
</script>
```

### unpkg

```html
<script type="module">
  import { diff } from 'https://unpkg.com/zen-json-patch';

  const operations = diff({ a: 1 }, { a: 2 });
  console.log(operations);
</script>
```

::: warning
CDN usage is convenient for prototyping but not recommended for production. Use a package manager for better performance and reliability.
:::

## Troubleshooting

### Module Resolution Issues

If you encounter module resolution issues with TypeScript:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // or "node16"
    "esModuleInterop": true
  }
}
```

### Type Definitions Not Found

Ensure TypeScript can find the type definitions:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

### Build Errors

If you encounter build errors, try clearing your cache:

```bash
# npm
rm -rf node_modules package-lock.json
npm install

# yarn
rm -rf node_modules yarn.lock
yarn install

# pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Next Steps

Now that you have zen-json-patch installed, learn how to use it:

- [Usage Guide](/guide/usage) - Core concepts and patterns
- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - Real-world usage examples
