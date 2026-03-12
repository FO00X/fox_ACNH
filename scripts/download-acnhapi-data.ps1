param(
  [string]$OutDir = "e:\Web\ACNH\data\acnhapi",
  [string]$Base = "https://cdn.jsdelivr.net/gh/alexislours/ACNHAPI@master"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$files = @(
  "art.json",
  "bugs.json",
  "fish.json",
  "fossils.json",
  "sea.json",
  "villagers.json",
  "houseware.json",
  "misc.json",
  "wallmounted.json",
  "music.json",
  "hourly.json"
)

foreach ($f in $files) {
  $url = "$Base/$f"
  $out = Join-Path $OutDir $f
  Write-Host "Downloading $url"
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $out
}

Write-Host "Done. Files saved to $OutDir"

