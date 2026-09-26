import { Command } from "commander";
import { registerProgramCommands } from "./command-registry.js";
import { createProgramContext } from "./context.js";
import { configureProgramHelp } from "./help.js";
import { registerPreActionHooks } from "./preaction.js";
import { renderBootConsole } from "../console/boot.js";

export function buildProgram() {
  const program = new Command();
  const ctx = createProgramContext();
  const argv = process.argv;

  configureProgramHelp(program, ctx);
  registerPreActionHooks(program, ctx.programVersion);

  registerProgramCommands(program, ctx, argv);

  program.action(() => {
    // Overriding the default `neer` behavior (which usually prints help).
    // Launch the Boot Console view if there are no subcommands.
    renderBootConsole(ctx.programVersion);
  });

  return program;
}
