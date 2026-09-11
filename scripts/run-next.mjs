import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const certPath = path.resolve(".certs/norton-ssl-root.pem");

if (fs.existsSync(certPath)) {
  if (!process.env.NODE_EXTRA_CA_CERTS) {
    process.env.NODE_EXTRA_CA_CERTS = certPath;
  }
  console.log(`[malbat] TLS: Norton-CA aktiv (${process.env.NODE_EXTRA_CA_CERTS})`);
}

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const nextArgs = process.argv.slice(2);
const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
