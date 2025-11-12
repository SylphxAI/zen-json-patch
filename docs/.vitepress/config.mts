import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "zen-json-patch",
  description: "RFC 6902 compliant JSON Patch generation - Monstrously fast, zero dependencies, TypeScript",
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:title', content: 'zen-json-patch - Fast JSON Patch' }],
    ['meta', { property: 'og:description', content: 'RFC 6902 compliant JSON Patch generation' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://zen-json-patch.sylphx.com' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Performance', link: '/performance' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Usage', link: '/guide/usage' }
          ]
        },
        {
          text: 'Specifications',
          items: [
            { text: 'RFC 6902 (JSON Patch)', link: '/guide/rfc6902' },
            { text: 'RFC 6901 (JSON Pointer)', link: '/guide/rfc6901' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'State Management', link: '/examples/state-management' },
            { text: 'API Responses', link: '/examples/api-responses' },
            { text: 'Version Control', link: '/examples/version-control' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/SylphxAI/zen-json-patch' },
      { icon: 'x', link: 'https://x.com/SylphxAI' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Sylphx'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/SylphxAI/zen-json-patch/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
