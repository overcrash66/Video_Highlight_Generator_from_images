import os
import shutil
import subprocess
import sys

def run_command(command, cwd=None):
    print(f"Running: {command} in {cwd or '.'}")
    try:
        subprocess.check_call(command, shell=True, cwd=cwd)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        sys.exit(1)

def clean():
    print("Cleaning up previous builds...")
    dirs_to_remove = ['build', 'dist', 'backend/video_highlight_generator.egg-info']
    for d in dirs_to_remove:
        if os.path.exists(d):
            shutil.rmtree(d)
            print(f"Removed {d}")

def build_frontend():
    print("Building Frontend...")
    frontend_dir = os.path.join(os.getcwd(), 'frontend')
    if os.path.exists(frontend_dir):
        # Install dependencies if needed (optional, but good for clean builds)
        # run_command('npm install', cwd=frontend_dir)
        run_command('npm run build', cwd=frontend_dir)
    else:
        print("Frontend directory not found, skipping frontend build.")

def build_backend():
    print("Building Backend (sdist and wheel)...")
    run_command('python setup.py sdist bdist_wheel')

def main():
    clean()
    build_frontend()
    build_backend()
    print("Build complete! Artifacts are in 'dist/' directory.")

if __name__ == "__main__":
    main()
