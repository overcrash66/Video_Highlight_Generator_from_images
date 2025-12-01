$ErrorActionPreference = "Stop"

Write-Host "Starting Build & Test Process..."

# 1. Clean previous builds
if (Test-Path "dist") {
    Write-Host "Cleaning previous builds..."
    try {
        Remove-Item -Recurse -Force "dist" -ErrorAction Stop
    } catch {
        Write-Warning "Could not remove 'dist' folder. It might be in use. Attempting to rename..."
        try {
            $timestamp = Get-Date -Format "yyyyMMddHHmmss"
            Rename-Item "dist" "dist_backup_$timestamp" -ErrorAction Stop
        } catch {
             Write-Warning "Could not rename 'dist'. Proceeding with build anyway..."
        }
    }
}
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "backend/video_highlight_generator.egg-info") { Remove-Item -Recurse -Force "backend/video_highlight_generator.egg-info" }

# 2. Build Frontend
Write-Host "Building Frontend..."
Push-Location frontend
try {
    Write-Host "Installing frontend dependencies..."
    npm install
    Write-Host "Building React app..."
    npm run build
} finally {
    Pop-Location
}

Write-Host "Verifying frontend assets..."
if (-not (Test-Path "backend/video_highlight_generator/static/index.html")) {
    Write-Error "Frontend assets not found!"
}

# 3. Build Wheel
Write-Host "Building Python Wheel..."
python setup.py bdist_wheel

# 4. Verification
Write-Host "Verifying Wheel..."
$wheelFile = Get-ChildItem "dist/*.whl" | Select-Object -First 1
if ($wheelFile) {
    Write-Host "Wheel created: $($wheelFile.Name)"
    
    # Create temp venv for smoke test
    # python -m venv temp_venv
    # .\temp_venv\Scripts\activate
    # pip install $wheelFile.FullName
    # video-highlight-generator --help (or just check import)
    # deactivate
    # Remove-Item -Recurse -Force "temp_venv"
    
    Write-Host "Build Successful!"
} else {
    Write-Error "Wheel file not found!"
}
