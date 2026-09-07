$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodePath = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))) {
  & $nodePath scripts/npm.mjs ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist/index.html'))) {
  & $nodePath node_modules/vite/bin/vite.js build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
}
Write-Host 'Astra Workspace: http://127.0.0.1:4317'
& $nodePath scripts/development.mjs
