import { fileURLToPath } from "node:url";

export function getAbsFileName(metaURL: string) {
	return fileURLToPath(metaURL);
}
