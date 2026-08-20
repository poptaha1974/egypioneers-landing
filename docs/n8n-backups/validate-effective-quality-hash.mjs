import { readFileSync } from "node:fs";

const source = readFileSync(
  "/home/ubuntu/egypioneers-landing/docs/n8n-backups/effective-quality-hash.js",
  "utf8",
);

new Function("$", source);
console.log("effective-quality-hash syntax is valid inside an n8n Code-node function");
