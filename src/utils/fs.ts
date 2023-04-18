import { dirname } from "node:path";
import type { Buffer } from "node:buffer";
import { existsSync, promises as fs } from "node:fs";

/**
 * Write file safely
 */
export function writeFileSafe(
	path: string,
	data: string | Buffer | Uint8Array = "",
) {
	const directory = dirname(path);
	if (!existsSync(directory))
		fs.mkdir(directory, { recursive: true });

	return fs.writeFile(path, data)
		.then(() => true)
		.catch(() => false);
}
