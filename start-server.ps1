# Simple HTTP Server for Job Tracker App
# This fixes CORS errors by serving files via HTTP instead of file://

$port = 8000
$path = $PSScriptRoot

Write-Host "🌐 Starting local web server..." -ForegroundColor Cyan
Write-Host "📁 Serving from: $path" -ForegroundColor White
Write-Host "🔗 Open in browser: http://localhost:$port" -ForegroundColor Green
Write-Host "⏹️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "✅ Server running at http://localhost:$port" -ForegroundColor Green
Write-Host ""

# Start browser
Start-Process "http://localhost:$port/index.html"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Get requested file path
        $requestedFile = $request.Url.LocalPath.TrimStart('/')
        if ($requestedFile -eq '' -or $requestedFile -eq '/') {
            $requestedFile = 'index.html'
        }
        
        $filePath = Join-Path $path $requestedFile

        # Log request
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - $($request.HttpMethod) $($request.Url.LocalPath)" -ForegroundColor Gray

        if (Test-Path $filePath) {
            # Determine content type
            $contentType = switch ([System.IO.Path]::GetExtension($filePath)) {
                '.html' { 'text/html; charset=utf-8' }
                '.js'   { 'application/javascript; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.gif'  { 'image/gif' }
                '.svg'  { 'image/svg+xml' }
                '.ico'  { 'image/x-icon' }
                default { 'application/octet-stream' }
            }

            # Read and serve file
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
        } else {
            # File not found
            $response.StatusCode = 404
            $errorMessage = "404 - File not found: $requestedFile"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentType = 'text/plain'
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $response.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "`n🛑 Server stopped" -ForegroundColor Red
}
