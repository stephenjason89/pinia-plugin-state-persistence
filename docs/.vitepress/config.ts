import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

export default defineConfig({
	title: 'Pinia State Persistence',
	description: 'Effortlessly persist Pinia states anywhere.',
	base: '/pinia-plugin-state-persistence/',
	sitemap: {
		hostname: 'https://stephenjason89.github.io/pinia-plugin-state-persistence/',
	},
	head: [
		['link', { rel: 'icon', href: '/pinia-plugin-state-persistence/favicon.ico' }],
		['meta', { name: 'author', content: 'Stephen Jason Wang' }],
		['meta', { name: 'keywords', content: 'Pinia, Vue, State Persistence, Plugin' }],
		['meta', { property: 'og:title', content: 'Pinia State Persistence' }],
		['meta', { property: 'og:description', content: 'Effortlessly persist Pinia states anywhere' }],
		['meta', { property: 'og:image', content: '/pinia-plugin-state-persistence/og-image.png' }],
		['meta', { property: 'og:url', content: 'https://stephenjason89.github.io/pinia-plugin-state-persistence/' }],
		['meta', { property: 'twitter:card', content: 'summary_large_image' }],
	],
	markdown: {
		typographer: true,
		codeTransformers: [
			transformerTwoslash({
				twoslashOptions: {
					compilerOptions: {
						types: ['pinia-plugin-state-persistence'],
						paths: { 'pinia-plugin-state-persistence': ['./dist'] },
					},
				},
			}),
		],
		config(md) {
			md.use(groupIconMdPlugin)
		},
		theme: {
			dark: 'dracula',
			light: 'github-light',
		},
	},
	themeConfig: {
		logo: '/icon.png',
		nav: [
			{ text: 'Guide', link: '/guide/' },
			{ text: 'API', link: '/api/' },
			{ text: 'GitHub', link: 'https://github.com/stephenjason89/pinia-plugin-state-persistence' },
		],
		sidebar: {
			'/guide/': [
				{ text: 'Overview', link: '/guide/' },
				{ text: 'Features', link: '/guide/features' },
				{ text: 'Installation', link: '/guide/installation' },
				{ text: 'Nuxt Integration', link: '/guide/nuxt-integration' },
				{ text: 'Configuration', link: '/guide/configuration' },
				{ text: 'Example Store', link: '/guide/example-store' },
				{ text: 'Advance Usage', link: '/guide/advance-usage' },
			],
			'/api/': [
				{ text: 'Overview', link: '/api/' },
				{ text: 'PersistOptions', link: '/api/persist-options' },
			],
		},
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/stephenjason89/pinia-plugin-state-persistence' },
		],
		search: { provider: 'local' },
		editLink: {
			text: 'Suggest changes to this page',
			pattern: 'https://github.com/stephenjason89/pinia-plugin-state-persistence/edit/main/docs/:path',
		},
		lastUpdatedText: 'Last updated',
	},
	lastUpdated: true,
	vite: {
		plugins: [
			groupIconVitePlugin(),
		],
	},
})
