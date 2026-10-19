param([switch]$Import, [string]$ExecuteId)
$ErrorActionPreference = 'Stop'
$taskIntegration = $PSScriptRoot
$taskRoot = Split-Path -Parent $taskIntegration
$taskBinary = Join-Path $taskRoot '.runtime/node_modules/n8n/bin/n8n'
if (-not (Test-Path -LiteralPath $taskBinary)) {
  throw 'Install the pinned runtime first: npm.cmd install --prefix .runtime --no-audit --no-fund --omit=dev n8n@2.43.8'
}
$env:N8N_USER_FOLDER = Join-Path $taskRoot '.runtime/state'
$env:N8N_LISTEN_ADDRESS = '127.0.0.1'
$env:N8N_HOST = 'localhost'
$env:N8N_PORT = '5678'
$env:N8N_PROTOCOL = 'http'
$env:N8N_WEBHOOK_URL = 'http://localhost:5678/'
$env:N8N_SECURE_COOKIE = 'false'
$env:GENERIC_TIMEZONE = 'Asia/Ho_Chi_Minh'
$env:TZ = 'Asia/Ho_Chi_Minh'
$env:N8N_DIAGNOSTICS_ENABLED = 'false'
$env:N8N_PERSONALIZATION_ENABLED = 'false'
$env:N8N_VERSION_NOTIFICATIONS_ENABLED = 'false'
$env:N8N_COMMUNITY_PACKAGES_ENABLED = 'false'
$env:N8N_BLOCK_ENV_ACCESS_IN_NODE = 'true'
$env:N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES = 'true'
$env:N8N_SSRF_PROTECTION_ENABLED = 'true'
$env:N8N_SSRF_ALLOWED_HOSTNAMES = 'localhost,127.0.0.1'
$env:N8N_SSRF_BLOCKED_IP_RANGES = 'default,0.0.0.0/0,::/0'
$env:N8N_DEFAULT_BINARY_DATA_MODE = 'default'
$env:N8N_PAYLOAD_SIZE_MAX = '6'
$env:N8N_FORMDATA_FILE_SIZE_MAX = '5'
$env:EXECUTIONS_DATA_SAVE_ON_ERROR = 'none'
$env:EXECUTIONS_DATA_SAVE_ON_SUCCESS = 'none'
$env:EXECUTIONS_DATA_SAVE_ON_PROGRESS = 'false'
$env:EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS = 'false'
$env:EXECUTIONS_TIMEOUT = '180'
$env:N8N_AI_TIMEOUT_MAX = '120000'
$env:N8N_CONCURRENCY_PRODUCTION_LIMIT = '2'
$env:N8N_LOG_LEVEL = 'warn'
if ($Import) {
  $env:N8N_LOG_LEVEL = 'info'
  & node $taskBinary import:workflow --input (Join-Path $taskIntegration 'rms-public-catalog.json')
  if ($LASTEXITCODE -ne 0) { throw 'Catalog import failed.' }
  & node $taskBinary import:workflow --input (Join-Path $taskIntegration 'rms-candidate-chat.json')
  if ($LASTEXITCODE -ne 0) { throw 'Chat import failed.' }
} elseif ($ExecuteId) {
  & node $taskBinary execute --id $ExecuteId --rawOutput
} else {
  & node $taskBinary start
}
