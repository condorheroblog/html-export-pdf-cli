import { fileURLToPath } from "node:url";

export function getAbsFileName() {
	return fileURLToPath(import.meta.url);
}
