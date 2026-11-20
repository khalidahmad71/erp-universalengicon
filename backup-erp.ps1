$envLines = Get-Content ".env.local"
$url = ($envLines | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" }) -replace "^NEXT_PUBLIC_SUPABASE_URL=", ""
$key = ($envLines | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" }) -replace "^NEXT_PUBLIC_SUPABASE_ANON_KEY=", ""

$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$outDir = "backups\$stamp"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$tables = @("projects", "materials", "boq", "purchase_orders", "grn", "dpr_logs", "contractor_bills", "enterprise_users", "vendors", "finance_ledger")
$headers = @{ "apikey" = $key.Trim('"').Trim("'"); "Authorization" = "Bearer $($key.Trim('"').Trim("'"))" }

foreach ($t in $tables) {
  try {
    $res = Invoke-RestMethod -Uri "$($url.Trim('"').Trim("'"))/rest/v1/$t?select=*" -Headers $headers -Method Get
    $res | ConvertTo-Json -Depth 10 | Set-Content "$outDir\$t.json" -Encoding UTF8
    Write-Output "Backed up: $t"
  } catch {
    Write-Output "Skipped (empty/missing): $t"
  }
}
Write-Output "Backup saved at: $outDir"
