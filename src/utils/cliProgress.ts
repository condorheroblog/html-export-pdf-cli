import { blue, cyan, dim, green, yellow } from "colorette";
import { Presets, SingleBar } from "cli-progress";

export function createProgress(indeterminate = false) {
	function getSpinner(n = 0) {
		return [cyan("●"), green("◆"), blue("■"), yellow("▲")][n % 4];
	}
	let current = 0;
	let spinner = 0;
	let text = "Generating";
	let timer: NodeJS.Timer;

	const progress = new SingleBar({
		clearOnComplete: true,
		hideCursor: true,
		format: `  {spin} {text} ${indeterminate ? dim(yellow("...")) : " {bar} {value}/{total}"}`,
		linewrap: false,
		barsize: 30,
	}, Presets.shades_grey);

	return {
		bar: progress,
		start(total: number) {
			progress.start(total, 0, { spin: getSpinner(spinner), text });
			timer = setInterval(() => {
				spinner += 1;
				progress.update({ spin: getSpinner(spinner), text });
			}, 200);
		},
		updateNumber(v: number) {
			current = v;
			progress.update(1, { spin: getSpinner(spinner), text });
		},
		increment(step: number) {
			progress.increment(step, { spin: getSpinner(spinner), text });
		},
		updateText(t: string) {
			text = t;
			progress.update(current, { spin: getSpinner(spinner), text });
		},
		stop() {
			clearInterval(timer);
			progress.stop();
		},
	};
}
