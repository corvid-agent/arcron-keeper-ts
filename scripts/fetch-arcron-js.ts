import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const ARCRON_JS_COMMIT = "ea83b069cc0168921758772362be206bfb7c3dae";

const root = join(import.meta.dir, "..");
const dest = join(root, ".deps", "arcron-js");
const marker = join(dest, ".commit");

if (existsSync(marker)) {
  const got = (await Bun.file(marker).text()).trim();
  if (got === ARCRON_JS_COMMIT && existsSync(join(dest, "package.json"))) {
    process.exit(0);
  }
}

const url = "https://github.com/CorvidLabs/arcron/archive/" + ARCRON_JS_COMMIT + ".tar.gz";
const tmp = join(root, ".deps", "_fetch.tgz");
await mkdir(join(root, ".deps"), { recursive: true });
const res = await fetch(url);
if (!res.ok) throw new Error("fetch " + url + " -> " + res.status);
await Bun.write(tmp, res);
await rm(dest, { recursive: true, force: true });
const extractRoot = join(root, ".deps", "_extract");
await rm(extractRoot, { recursive: true, force: true });
await mkdir(extractRoot, { recursive: true });
const tar = Bun.spawn(["tar", "-xzf", tmp, "-C", extractRoot], { stdout: "inherit", stderr: "inherit" });
if ((await tar.exited) !== 0) throw new Error("tar failed");
const unpacked = join(extractRoot, "arcron-" + ARCRON_JS_COMMIT, "js");
if (!existsSync(join(unpacked, "package.json"))) throw new Error("js/package.json missing");
const cp = Bun.spawn(["cp", "-a", unpacked, dest], { stdout: "inherit", stderr: "inherit" });
if ((await cp.exited) !== 0) throw new Error("cp failed");
await Bun.write(marker, ARCRON_JS_COMMIT + "\n");
await rm(tmp, { force: true });
await rm(extractRoot, { recursive: true, force: true });
