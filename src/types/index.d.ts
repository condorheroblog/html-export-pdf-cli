import type { EventEmitter } from "node:events";

export { };

declare global {
	interface Window {
		Paged: {
			Previewer: typeof pagedjs
		}
		PagedConfig: {
			auto?: boolean,
			before?: () => void,
			after?: (argv: unknown) => void,
			content?: HTMLElement,
			stylesheets?: StyleSheet[],
			renderTo?: HTMLElement,
			settings?: PreviewerConfig,
		};
		PagedPolyfill: {
			previewer: Previewer
		}
		onSize: (size: number) => void
		onPage: (page: Page) => void
		onRendered: (msg: string, width: number, height: number, orientation: boolean) => void
	}
}

// --------- for pagedjs ---------

declare class Chunker { }

interface PreviewerConfig {
	maxChars?: number;
	hyphenGlyph?: string;
}

interface Previewer extends EventEmitter {
	new(config?: PreviewerConfig): Previewer;
	preview(content?: HTMLElement, stylesheets?: StyleSheet[], renderTo?: HTMLElement): Promise<Chunker>;
}

export interface Page {
	id: string;
	width: number;
	height: number;
	startToken: string;
	endToken: string;
	breakAfter: string;
	breakBefore: string;
	position: number;
	boxes: {
		media: {
			width: number;
			height: number;
			x: number;
			y: number;
		};
		crop: {
			width: number;
			height: number;
			x: number;
			y: number;
		};
	},

}

declare module "pagedjs" {
	export const Previewer: Previewer;
}

