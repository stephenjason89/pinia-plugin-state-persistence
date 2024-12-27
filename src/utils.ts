export function createLogger(debug: boolean) {
	return {
		info: (message: string, ...args: any[]) => {
			if (debug) {
				console.info(`[PersistPlugin] INFO: ${message}`, ...args)
			}
		},
		warn: (message: string, ...args: any[]) => {
			if (debug) {
				console.warn(`[PersistPlugin] WARN: ${message}`, ...args)
			}
		},
		error: (message: string, ...args: any[]) => {
			if (debug) {
				console.error(`[PersistPlugin] ERROR: ${message}`, ...args)
			}
		},
	}
}
