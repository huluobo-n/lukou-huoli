import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(root, "tests", "logic-bundle.mjs");
const build = spawnSync(
  path.join(root, "node_modules", ".bin", "esbuild"),
  [
    path.join(root, "tests", "logic-test.ts"),
    "--bundle",
    "--platform=node",
    "--format=esm",
    "--target=es2020",
    `--outfile=${outfile}`,
  ],
  { cwd: root, stdio: "inherit" },
);
if (build.status !== 0) process.exit(build.status ?? 1);
const run = spawnSync(process.execPath, [outfile], { cwd: root, stdio: "inherit" });
process.exit(run.status ?? 1);
