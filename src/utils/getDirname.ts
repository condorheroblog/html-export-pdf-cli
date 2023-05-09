import { dirname } from "node:path";
import { getAbsFileName } from "./getAbsFileName";

export function getDirname(metaURL: string) {
	return dirname(getAbsFileName(metaURL));
}
