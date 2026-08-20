import fs from "node:fs/promises";

const workflowId = "swr2aTOO9NZ5dvQE";
const credentialFile = "/home/ubuntu/skills/egypioneers-leads-automation/references/credentials.md";
const apiKey = (await fs.readFile(credentialFile, "utf8")).split("\n")[4]?.replaceAll("`", "").trim();
if (!apiKey) throw new Error("Missing n8n API key reference");

const baseUrl = "https://allhomz.app.n8n.cloud/api/v1";
const headers = { "Content-Type": "application/json", "X-N8N-API-KEY": apiKey };
const response = await fetch(`${baseUrl}/workflows/${workflowId}`, { headers });
if (!response.ok) throw new Error(`Unable to read workflow: ${response.status}`);

const workflow = await response.json();
await fs.writeFile(
  "/home/ubuntu/manus_report/lead_qualifier_workflow_BACKUP_pre_source_url_fix.json",
  JSON.stringify(workflow, null, 2),
);

const hashNode = workflow.nodes.find((node) => node.name === "Hash User Data");
let code = hashNode?.parameters?.jsCode;
if (!code) throw new Error("Hash User Data node was not found");
if (!code.includes("const browserEventId = String(b.event_id || '').trim();")) {
  throw new Error("Browser event_id support must exist before adding event_source_url");
}

if (!code.includes("const eventSourceUrl = String(b.event_source_url || '').trim();")) {
  code = code.replace(
    "const browserEventId = String(b.event_id || '').trim();",
    "const browserEventId = String(b.event_id || '').trim();\nconst eventSourceUrl = String(b.event_source_url || '').trim();",
  );
}

if (!code.includes("event_source_url: eventSourceUrl || undefined,")) {
  code = code.replace(
    "action_source: 'website',   // === FIX 1: was \"chat\" ===",
    "action_source: 'website',   // === FIX 1: was \"chat\" ===\n        event_source_url: eventSourceUrl || undefined,",
  );
}

hashNode.parameters.jsCode = code;
const payload = { name: workflow.name, nodes: workflow.nodes, connections: workflow.connections, settings: workflow.settings };
const update = await fetch(`${baseUrl}/workflows/${workflowId}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(payload),
});
if (!update.ok) throw new Error(`Unable to update workflow: ${update.status}`);

const updated = await update.json();
await fs.writeFile(
  "/home/ubuntu/manus_report/lead_qualifier_workflow_after_source_url_fix.json",
  JSON.stringify(updated, null, 2),
);
const applied = updated.nodes.find((node) => node.name === "Hash User Data")?.parameters?.jsCode || "";
if (!applied.includes("event_source_url: eventSourceUrl || undefined,")) {
  throw new Error("Workflow update response did not contain event_source_url");
}

console.log(JSON.stringify({ workflowId, active: updated.active, eventSourceUrlSupported: true }, null, 2));
