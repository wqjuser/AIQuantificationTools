import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const candidates = [
  { command: "py", prefixArgs: ["-3"] },
  { command: "python3", prefixArgs: [] },
  { command: "python", prefixArgs: [] },
];

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.prefixArgs, ...args], {
    stdio: "inherit",
    shell: false,
  });

  if (result.error?.code === "ENOENT") {
    continue;
  }

  if (result.error) {
    console.error(`Failed to run ${candidate.command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.signal) {
    process.kill(process.pid, result.signal);
  }

  process.exit(result.status ?? 1);
}

console.error("No Python interpreter found. Tried python3, python, and py -3.");
process.exit(127);
