export function isValidUrl(url: string) {
	return /^(https?|file|data):/i.test(url);
}
