param(
    [string]$RunDir = "$PSScriptRoot/fixtures/sample-run"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$validator = Join-Path $repoRoot "scripts/validate-artifacts.ps1"

if (-not (Test-Path -LiteralPath $validator)) {
    throw "Missing validator: $validator"
}

& $validator -RunDir $RunDir
