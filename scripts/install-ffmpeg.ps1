$paths = @(
    (Join-Path (Get-Location) ".whisper"),
    "C:\Users\khali\.neer\workspace\.whisper"
)

foreach ($whisperDir in $paths) {
    Write-Host "Checking $whisperDir..."
    $binDir = Join-Path $whisperDir "bin"
    if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force }

    # FFmpeg
    $ffmpegExe = Join-Path $binDir "ffmpeg.exe"
    if (-not (Test-Path $ffmpegExe)) {
        Write-Host "Downloading FFmpeg to $binDir..."
        $url = "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffmpeg-6.1-win-64.zip"
        $zip = Join-Path $binDir "ffmpeg.zip"
        Invoke-WebRequest -Uri $url -OutFile $zip
        Expand-Archive -Path $zip -DestinationPath $binDir -Force
        Remove-Item $zip
    }
    else {
        Write-Host "FFmpeg already exists in $binDir"
    }

    # FFprobe
    $ffprobeExe = Join-Path $binDir "ffprobe.exe"
    if (-not (Test-Path $ffprobeExe)) {
        Write-Host "Downloading FFprobe to $binDir..."
        $url = "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffprobe-6.1-win-64.zip"
        $zip = Join-Path $binDir "ffprobe.zip"
        Invoke-WebRequest -Uri $url -OutFile $zip
        Expand-Archive -Path $zip -DestinationPath $binDir -Force
        Remove-Item $zip
    }
    else {
        Write-Host "FFprobe already exists in $binDir"
    }
}

Write-Host "FFmpeg and FFprobe are ready in all locations."
exit 0
