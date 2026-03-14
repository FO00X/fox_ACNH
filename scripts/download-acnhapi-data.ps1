# 数据来源: ACNH API 社区镜像 (GitHub alexislours/ACNHAPI)
# jsDelivr 格式: https://cdn.jsdelivr.net/gh/user/repo@version/file.json
# 本脚本优先使用 raw GitHub，避免 jsDelivr 的 URL 校验报错
param(
  [string]$OutDir = "e:\Web\ACNH\data\acnhapi",
  [string]$Branch = "master"
)

$ErrorActionPreference = "Stop"

# 优先 raw GitHub（稳定）；备用 jsDelivr（格式必须为 /gh/user/repo@version/file）
$RawBase = "https://raw.githubusercontent.com/alexislours/ACNHAPI/$Branch"
$CdnBase = "https://cdn.jsdelivr.net/gh/alexislours/ACNHAPI@$Branch"

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
  $out = Join-Path $OutDir $f
  $url = "$RawBase/$f"
  try {
    Write-Host "Downloading $url"
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $out -MaximumRedirection 2
  } catch {
    Write-Host "Raw GitHub failed, trying jsDelivr: $CdnBase/$f"
    try {
      Invoke-WebRequest -UseBasicParsing -Uri "$CdnBase/$f" -OutFile $out -MaximumRedirection 2
    } catch {
      Write-Error "Failed to download $f : $_"
    }
  }
}

Write-Host "Done. Files saved to $OutDir"
