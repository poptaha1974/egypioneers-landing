def redact_url:
  gsub("(?i)(access_token|api_key|apikey|authorization|secret|password)=([^&[:space:]]+)"; "[REDACTED_QUERY_PARAMETER]");

def scrub:
  if type == "object" then
    with_entries(
      if (.key | test("credential|token|secret|authorization|api.?key|password"; "i")) then
        .value = "[REDACTED]"
      else
        .value |= scrub
      end
    )
  elif type == "array" then map(scrub)
  elif type == "string" then redact_url
  else .
  end;

{
  export_notice: "Sanitized review export. Credentials, tokens, secrets, authorization values and sensitive URL parameters are redacted.",
  workflow: {
    name,
    active,
    nodes,
    connections,
    settings
  }
} | scrub
