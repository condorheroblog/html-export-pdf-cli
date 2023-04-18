import path from "node:path";

function startsWithSingleDot(filePath: string) {
	const first2chars = filePath.slice(0, 2);
	return first2chars === `.${path.sep}` || first2chars === "./";
}

export function replaceExt(npath: string, ext: string) {
	if (typeof npath !== "string" || npath.length === 0)
		return npath;

	const nFileName = path.basename(npath, path.extname(npath)) + ext;
	const nFilepath = path.join(path.dirname(npath), nFileName);

	// Because `path.join` removes the head './' from the given path.
	// This removal can cause a problem when passing the result to `require` or
	// `import`.
	if (startsWithSingleDot(npath))
		return `.${path.sep}${nFilepath}`;

	return nFilepath;
}
