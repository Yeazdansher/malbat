$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path ".certs" | Out-Null

$stores = @(
  @{ Name = "Root"; Location = "CurrentUser" },
  @{ Name = "Root"; Location = "LocalMachine" }
)

$cert = $null

foreach ($entry in $stores) {
  $store = New-Object System.Security.Cryptography.X509Certificates.X509Store(
    $entry.Name,
    $entry.Location
  )
  $store.Open("ReadOnly")
  $matches = @(
    $store.Certificates |
      Where-Object { $_.Subject -like "*Norton Web/Mail Shield Root*" }
  )
  $store.Close()

  if ($matches.Count -gt 0) {
    $cert = $matches[0]
    break
  }
}

if (-not $cert) {
  Write-Error "Norton Web/Mail Shield Root wurde nicht gefunden."
}

$pem = @"
-----BEGIN CERTIFICATE-----
$([Convert]::ToBase64String($cert.RawData, "InsertLineBreaks"))
-----END CERTIFICATE-----
"@

Set-Content -Path ".certs/norton-ssl-root.pem" -Value $pem -Encoding ascii
Write-Host "Exportiert nach .certs/norton-ssl-root.pem"
Write-Host "Thumbprint: $($cert.Thumbprint)"
Write-Host "Danach: npm run dev"
