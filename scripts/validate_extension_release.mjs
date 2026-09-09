import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(scriptsDir, "validate_extension.mjs");
const runtimePath = path.join(scriptsDir, ".validate_extension_release.runtime.mjs");
const releaseVersion = "0.7.8";

const source = await readFile(sourcePath, "utf8");
const releaseSource = source.replaceAll("0.7.4", releaseVersion);

await writeFile(runtimePath, releaseSource, "utf8");
try {
  await import(`${pathToFileURL(runtimePath).href}?release=${releaseVersion}`);
} finally {
  await unlink(runtimePath).catch(() => {});
}
