param(
  [string]$Url = "http://127.0.0.1:3001/",
  [int]$MaxWaitSeconds = 30,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Test-UrlReady {
  param([string]$TargetUrl)
  try {
    Invoke-WebRequest -Uri $TargetUrl -Method Head -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    try {
      Invoke-WebRequest -Uri $TargetUrl -Method Get -UseBasicParsing -TimeoutSec 2 | Out-Null
      return $true
    } catch {
      return $false
    }
  }
}

if ($DryRun) {
  Write-Host "Dry run OK"
  Write-Host "Project root: $projectRoot"
  Write-Host "Will run: npm start"
  Write-Host "Will open: $Url"
  exit 0
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm was not found in PATH. Install Node.js first."
}

$startCmd = "Set-Location '$projectRoot'; npm start"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $startCmd | Out-Null

$deadline = (Get-Date).AddSeconds($MaxWaitSeconds)
while ((Get-Date) -lt $deadline) {
  if (Test-UrlReady -TargetUrl $Url) {
    Start-Process $Url
    Write-Host "Server is up. Opened $Url"
    exit 0
  }
  Start-Sleep -Milliseconds 500
}

Write-Warning "Server did not respond within $MaxWaitSeconds seconds."
Write-Warning "It may still be starting; open $Url manually if needed."


