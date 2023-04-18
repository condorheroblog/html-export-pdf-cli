export function collectParameters(value: string, previous: string[]) {
	return previous.concat([value]);
}

export function commaSeparatedList(value: string) {
	return value.split(",");
}
