<#
.SYNOPSIS
  Serves this site locally so you can preview it in a browser.

.DESCRIPTION
  Self-contained static file server for the Atari Investors site — no
  Python, Node, or any other dependency required, just PowerShell.
  Works with both Windows PowerShell 5.1 and PowerShell 7+ (pwsh).

.EXAMPLE
  .\serve.ps1
  Serves the site at http://localhost:8000/ and opens it in your browser.

.EXAMPLE
  .\serve.ps1 -Port 5500
  Serves on a different port.

.EXAMPLE
  .\serve.ps1 -NoBrowser
  Serves without automatically opening a browser tab.
#>

param(
    [int]$Port = 8000,
    [switch]$NoBrowser
)

# If PowerShell's script execution policy blocks this file, run it with:
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css'
    '.js'   = 'application/javascript'
    '.json' = 'application/json'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2' = 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.txt'  = 'text/plain'
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"

try {
    $listener.Prefixes.Add($prefix)
    $listener.Start()
} catch {
    Write-Error "Could not bind to $prefix — is something else already using port $Port? Try: .\serve.ps1 -Port 8001"
    return
}

Write-Host "Serving '$root'" -ForegroundColor Cyan
Write-Host "  -> $prefix" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop.`n"

if (-not $NoBrowser) {
    try {
        Start-Process $prefix | Out-Null
    } catch {
        Write-Host "(Could not auto-open a browser — open $prefix manually.)" -ForegroundColor DarkYellow
    }
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $localPath = [Uri]::UnescapeDataString($request.Url.LocalPath)
            if ($localPath -eq '/') { $localPath = '/index.html' }

            # Resolve against $root and make sure we never escape it.
            $relative = $localPath.TrimStart('/') -replace '/', [IO.Path]::DirectorySeparatorChar
            $fullPath = [IO.Path]::GetFullPath((Join-Path $root $relative))

            if (-not $fullPath.StartsWith([IO.Path]::GetFullPath($root))) {
                $response.StatusCode = 403
            } elseif (Test-Path -LiteralPath $fullPath -PathType Leaf) {
                $ext = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
                $contentType = $mimeTypes[$ext]
                if (-not $contentType) { $contentType = 'application/octet-stream' }

                $bytes = [IO.File]::ReadAllBytes($fullPath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "  200  $localPath"
            } else {
                $response.StatusCode = 404
                $notFoundBytes = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
                $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
                Write-Host "  404  $localPath" -ForegroundColor Yellow
            }
        } catch {
            $response.StatusCode = 500
            Write-Host "  500  $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            $response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
    Write-Host "`nServer stopped."
}
