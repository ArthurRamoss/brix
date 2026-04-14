$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot '.env.local'

if (-not (Test-Path $envFile)) {
  throw ".env.local not found at $envFile"
}

Get-Content $envFile | ForEach-Object {
  if ([string]::IsNullOrWhiteSpace($_) -or $_.TrimStart().StartsWith('#')) {
    return
  }

  $parts = $_ -split '=', 2
  if ($parts.Count -ne 2) {
    return
  }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim().Trim('"')
  Set-Item -Path "Env:$key" -Value $value
}

if (-not $env:COLOSSEUM_COPILOT_API_BASE -or -not $env:COLOSSEUM_COPILOT_PAT) {
  throw "COLOSSEUM_COPILOT_API_BASE or COLOSSEUM_COPILOT_PAT is missing"
}

$headers = @{
  Authorization = "Bearer $env:COLOSSEUM_COPILOT_PAT"
}

Invoke-RestMethod -Uri "$env:COLOSSEUM_COPILOT_API_BASE/status" -Headers $headers |
  ConvertTo-Json
