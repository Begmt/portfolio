param(
  [string]$SiteUrl = 'https://begmt.github.io/portfolio/',
  [string]$OutputRoot = (Join-Path $env:TEMP 'portfolio-lighthouse-series-20261109')
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$measureSource = [IO.File]::ReadAllText((Join-Path $projectRoot 'audit/phase3/measure.cjs'))
# Отчёты остаются во временной папке до окончания всей серии: OneDrive не синхронизирует их между прогонами.
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
$outputLiteral = ConvertTo-Json -InputObject $OutputRoot -Compress
$measureSource = $measureSource.Replace('__dirname', $outputLiteral)
for ($run = 1; $run -le 5; $run++) {
  foreach ($theme in @('dark', 'light')) {
    $prefix = "final-mobile-$theme-$run"
    $measureSource | node - $theme $SiteUrl $prefix
    if ($LASTEXITCODE -ne 0) { throw "Lighthouse failed: $prefix" }
  }
}
Write-Output "Series complete: $OutputRoot"
