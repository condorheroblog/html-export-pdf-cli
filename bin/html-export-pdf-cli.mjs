#!/usr/bin/env node
"use strict";
import { runCli } from "../dist/commands/runner.js";
import { HTML_EXPORT_PDF_CLI } from "../dist/constants/index.js";

runCli(HTML_EXPORT_PDF_CLI);
