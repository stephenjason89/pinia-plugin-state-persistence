import { defineConfig } from 'vitepress'

export default defineConfig({
	title: 'Pinia State Persistence',
	description: 'Effortlessly persist Pinia states anywhere.',
	base: '/pinia-plugin-state-persistence/',
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
			],
			'/api/': [
				{ text: 'Overview', link: '/api/' },
				{ text: 'PersistOptions', link: '/api/persist-options' },
			],
		},
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/stephenjason89/pinia-plugin-state-persistence' },
		],
	},
})
