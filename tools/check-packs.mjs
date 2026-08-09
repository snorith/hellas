import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { mkdtemp, readdir, rm, readFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
const tmp = await mkdtemp(path.join(os.tmpdir(), "hellas-packcheck-"));
for (const p of ["system-skills","system-talents","system-dynamisms"]) {
  const dest = path.join(tmp, p);
  await extractPack(`packs/${p}`, dest);
  const files = await readdir(dest);
  console.log(p, "roundtrip docs:", files.length);
  if (files.length) {
    const doc = JSON.parse(await readFile(path.join(dest, files[0]), "utf8"));
    console.log("  sample:", doc.name, "| system keys:", Object.keys(doc.system ?? {}).join(","));
  }
}
await rm(tmp, {recursive: true, force: true});
