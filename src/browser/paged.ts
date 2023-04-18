import * as Paged from "pagedjs";

window.Paged = Paged;

const ready = new Promise((resolve) => {
	if (document.readyState === "interactive" || document.readyState === "complete") {
		resolve(document.readyState);
		return;
	}

	document.onreadystatechange = function () {
		if (document.readyState === "interactive")
			resolve(document.readyState);
	};
});

const config = window.PagedConfig || {
	auto: true,
	before: undefined,
	after: undefined,
	content: undefined,
	stylesheets: undefined,
	renderTo: undefined,
	settings: {},
};

export const previewer = new Paged.Previewer(config.settings);

ready.then(async () => {
	let done;
	if (config.before)
		await config.before();

	if (config.auto)
		done = await previewer.preview(config.content, config.stylesheets, config.renderTo);

	if (config.after)
		await config.after(done);
});
