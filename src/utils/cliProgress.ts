import { blue, cyan, dim, green, yellow } from "colorette";
import { Presets, SingleBar } from "cli-progress";

function replaceTitle(title: string) {
	return title.length ? `|| ${title}` : "";
}

export function createProgress(indeterminate = false) {
	function getSpinner(n = 0) {
		return [cyan("●"), green("◆"), blue("■"), yellow("▲")][n % 4];
	}
	let current = 0;
	let spinner = 0;
	let text = "Generating";
	let title = "";
	let timer: NodeJS.Timeout;

	const progress = new SingleBar({
		clearOnComplete: false,
		hideCursor: true,
		format: `  {spin} {text} ${indeterminate ? dim(yellow("...")) : " {bar} {value}/{total}"} {title} `,
		linewrap: false,
		barsize: 30,
	}, Presets.shades_grey);

	return {
		bar: progress,
		start(total: number) {
			progress.start(total, 0, { spin: getSpinner(spinner), text, title: replaceTitle(title) });
			timer = setInterval(() => {
				spinner += 1;
				progress.update({ spin: getSpinner(spinner), text, title: replaceTitle(title) });
			}, 200);
		},
		updateNumber(v: number) {
			current = v;
			progress.update(v, { spin: getSpinner(spinner), text, title: replaceTitle(title) });
		},
		increment(step: number, { txt, headTitle }: { txt?: string; headTitle?: string } = { txt: "", headTitle: "" }) {
			text = txt?.length ? txt : text;
			title = headTitle?.length ? headTitle : title;
			progress.increment(step, { spin: getSpinner(spinner), text, title: replaceTitle(title) });
		},
		updateText(t: string) {
			text = t;
			progress.update(current, { spin: getSpinner(spinner), text, title: replaceTitle(title) });
		},
		updateTitle(t: string) {
			title = t;
			progress.update(current, { spin: getSpinner(spinner), text, title: replaceTitle(title) });
		},
		stop() {
			clearInterval(timer);
			progress.stop();
		},
	};
}
