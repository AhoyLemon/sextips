import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import chalk from "chalk";

interface Task {
  name: string;
  script: string;
  color: (text: string) => string;
}

const tasks: Task[] = [
  { name: "sass", script: "watch:sass", color: chalk.magenta },
  { name: "pug", script: "watch:pug", color: chalk.cyan },
  { name: "ts", script: "watch:ts", color: chalk.yellow },
  { name: "serve", script: "serve", color: chalk.green },
];

console.log(chalk.bold("Starting dev servers (sass, pug, ts, browser-sync)...\n"));

function forward(prefix: string, data: Buffer, stream: NodeJS.WriteStream): void {
  data
    .toString()
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .forEach((line) => stream.write(`${prefix} ${line}\n`));
}

const children: ChildProcessWithoutNullStreams[] = tasks.map((task) => {
  const child = spawn("bun", ["run", task.script], { stdio: "pipe" });
  const prefix = task.color(`[${task.name}]`);

  child.stdout.on("data", (data: Buffer) => forward(prefix, data, process.stdout));
  child.stderr.on("data", (data: Buffer) => forward(prefix, data, process.stderr));
  child.on("exit", (code) => console.log(`${prefix} exited with code ${code}`));

  return child;
});

process.on("SIGINT", () => {
  children.forEach((child) => child.kill());
  process.exit(0);
});
