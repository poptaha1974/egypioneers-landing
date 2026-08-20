import fs from "node:fs/promises";

const workflowId = "swr2aTOO9NZ5dvQE";
const credentialFile = "/home/ubuntu/skills/egypioneers-leads-automation/references/credentials.md";
const credentialLines = (await fs.readFile(credentialFile, "utf8")).split("\n");
const apiKey = credentialLines[4]?.replaceAll("`", "").trim();

if (!apiKey) {
  throw new Error("Missing n8n API key reference");
}

const baseUrl = "https://allhomz.app.n8n.cloud/api/v1";
const headers = {
  "Content-Type": "application/json",
  "X-N8N-API-KEY": apiKey,
};

const currentResponse = await fetch(`${baseUrl}/workflows/${workflowId}`, { headers });
if (!currentResponse.ok) {
  throw new Error(`Unable to read workflow: ${currentResponse.status}`);
}

const workflow = await currentResponse.json();
await fs.writeFile(
  "/home/ubuntu/manus_report/lead_qualifier_workflow_BACKUP_pre_event_id_fix.json",
  JSON.stringify(workflow, null, 2),
);

const hashNode = workflow.nodes.find((node) => node.name === "Hash User Data");
if (!hashNode?.parameters?.jsCode) {
  throw new Error("Hash User Data node was not found");
}

const oldCode = hashNode.parameters.jsCode;
const oldLine = "const event_id = contactId ? (idPrefix + contactId) : (idPrefix + eventTime);";
const newLines = `// Browser and server share this ID to let Meta deduplicate the Lead event.
const browserEventId = String(b.event_id || '').trim();
const event_id = browserEventId || (contactId ? (idPrefix + contactId) : (idPrefix + eventTime));`;

if (!oldCode.includes(oldLine)) {
  throw new Error("Expected event_id fallback line was not found; no update was applied");
}

hashNode.parameters.jsCode = oldCode.replace(oldLine, newLines);
const payload = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings,
};

const updateResponse = await fetch(`${baseUrl}/workflows/${workflowId}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(payload),
});
if (!updateResponse.ok) {
  throw new Error(`Unable to update workflow: ${updateResponse.status}`);
}

const updated = await updateResponse.json();
await fs.writeFile(
  "/home/ubuntu/manus_report/lead_qualifier_workflow_after_event_id_fix.json",
  JSON.stringify(updated, null, 2),
);

const appliedCode = updated.nodes.find((node) => node.name === "Hash User Data")?.parameters?.jsCode || "";
if (!appliedCode.includes("const browserEventId = String(b.event_id || '').trim();")) {
  throw new Error("Workflow update response did not contain browser event ID handling");
}

console.log(JSON.stringify({
  workflowId,
  active: updated.active,
  browserEventIdSupported: true,
}, null, 2));
