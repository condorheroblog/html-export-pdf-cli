import { dirname } from "node:path";
import { getAbsFileName } from "./getAbsFileName";

export function getDirname() {
	return dirname(getAbsFileName());
}
