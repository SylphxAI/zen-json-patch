# zen-json-patch Documentation

This directory contains the VitePress documentation site for zen-json-patch.

## Local Development

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The documentation site will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in `.vitepress/dist/`

### Preview Production Build

```bash
npm run preview
```

## Deployment

This documentation is automatically deployed to Vercel at:
- **Production**: https://zen-json-patch.sylphx.com

The deployment is configured via `/vercel.json` in the repository root.

## Structure

```
docs/
├── .vitepress/
│   └── config.mts          # VitePress configuration
├── guide/
│   ├── index.md            # Getting Started
│   ├── installation.md     # Installation instructions
│   ├── usage.md            # Core usage guide
│   ├── rfc6902.md          # RFC 6902 specification
│   └── rfc6901.md          # RFC 6901 JSON Pointer
├── api/
│   └── index.md            # API reference
├── examples/
│   ├── index.md            # Examples overview
│   ├── state-management.md # State management examples
│   ├── api-responses.md    # API integration examples
│   └── version-control.md  # Version control examples
├── index.md                # Home page
└── performance.md          # Performance benchmarks
```

## Writing Documentation

### Markdown Features

VitePress supports enhanced Markdown with:

- **Code blocks** with syntax highlighting
- **Custom containers** (`::: info`, `::: warning`, `::: danger`)
- **Frontmatter** for page metadata
- **Internal links** for navigation
- **Custom components** (Vue components)

### Example Code Blocks

\`\`\`typescript
import { diff } from 'zen-json-patch';

const operations = diff(obj1, obj2);
\`\`\`

### Custom Containers

\`::: info
This is an info box
:::

::: warning
This is a warning
:::

::: danger
This is a danger warning
:::\`

## Updating Content

1. Edit the relevant `.md` file
2. Changes will hot-reload in development mode
3. Commit and push to deploy

## Adding New Pages

1. Create a new `.md` file in the appropriate directory
2. Add the page to the sidebar in `.vitepress/config.mts`
3. Link to it from other pages as needed

Example sidebar configuration:

\`\`\`typescript
sidebar: {
  '/guide/': [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/guide/' },
        { text: 'Installation', link: '/guide/installation' }
      ]
    }
  ]
}
\`\`\`

## Assets

Place static assets (images, etc.) in:
- `docs/public/` - Available at `/filename.ext`

## Contributing

When updating documentation:

1. Keep examples practical and runnable
2. Include TypeScript types in examples
3. Link to related pages
4. Test locally before committing
5. Follow the existing style and structure

## Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Markdown Guide](https://vitepress.dev/guide/markdown)
- [Theme Configuration](https://vitepress.dev/reference/default-theme-config)
