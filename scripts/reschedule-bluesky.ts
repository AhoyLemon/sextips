import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { addDays, currentWindowAnchorDate, drawScheduledSlots, type ScheduledSlot } from "../ts/lib/postScheduleWindow.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workflowPath = path.resolve(__dirname, "../.github/workflows/post-bluesky.yml");

const BEGIN_MARKER = "# BEGIN AUTO-GENERATED SCHEDULE (updated daily by scripts/reschedule-bluesky.ts — do not hand-edit)";
const END_MARKER = "# END AUTO-GENERATED SCHEDULE";

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildScheduleBlock(indent: string, slots: ScheduledSlot[]): string {
  return [
    `${indent}${BEGIN_MARKER}`,
    ...slots.map((slot) => `${indent}- cron: "${slot.cron}"`),
    `${indent}${END_MARKER}`,
  ].join("\n");
}

function main(): void {
  const tomorrow = addDays(currentWindowAnchorDate(new Date()), 1);
  const slots = drawScheduledSlots(tomorrow);

  const content = fs.readFileSync(workflowPath, "utf8");
  const blockPattern = new RegExp(`([ \\t]*)${escapeForRegExp(BEGIN_MARKER)}[\\s\\S]*?${escapeForRegExp(END_MARKER)}`);
  const match = content.match(blockPattern);
  if (!match) {
    throw new Error(`Could not find the auto-generated schedule block (between the BEGIN/END markers) in ${workflowPath}`);
  }

  const updated = content.replace(blockPattern, buildScheduleBlock(match[1], slots));
  fs.writeFileSync(workflowPath, updated);

  const label = `${tomorrow.year}-${String(tomorrow.month).padStart(2, "0")}-${String(tomorrow.day).padStart(2, "0")}`;
  console.log(`Rescheduled ${path.basename(workflowPath)} for ${label} (Central-time window):`);
  slots.forEach((slot) => console.log(`  ${slot.cron}`));
}

try {
  main();
} catch (err) {
  console.error("reschedule-bluesky failed:", err);
  process.exit(1);
}
