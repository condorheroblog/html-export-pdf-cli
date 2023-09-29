import process from "node:process";
import type { Command } from "commander";
import { program } from "commander";
import { red } from "colorette";

import pkg from "../../package.json";
import { HTML_EXPORT_PDF_CLI } from "../constants";
import { createHtmlExportPdf } from "./htmlExportPdf";

export function registerCommands(cliInstance: Command, programName: string) {
	switch (programName) {
		case HTML_EXPORT_PDF_CLI:
			createHtmlExportPdf(cliInstance);
			break;
		default:
			process.stdout.write(red("no command name"));
			break;
	}
}

export function beforeParse(cliInstance: Command) {
	// display cli version, display help message
	cliInstance.version(pkg.version);
}

export function afterParse(cliInstance: Command) {
	if (!process.argv.slice(2).filter(Boolean).length)
		cliInstance.outputHelp();
}

export function runCli(programName: string) {
	registerCommands(program, programName);
	beforeParse && beforeParse(program);
	program.parse(process.argv);
	afterParse && afterParse(program);
}
