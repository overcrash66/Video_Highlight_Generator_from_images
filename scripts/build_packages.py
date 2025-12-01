import os
import shutil
import subprocess
import sys

def clean_build_artifacts():
    """Removes build/ dist/ and .egg-info directories."""
    print("Cleaning build artifacts...")
    dirs_to_remove = ["build", "dist"]
    
    # Find egg-info dirs
    for item in os.listdir("."):
        if item.endswith(".egg-info"):
            dirs_to_remove.append(item)
            
    for d in dirs_to_remove:
        if os.path.exists(d):
            print(f"Removing {d}...")
            try:
                shutil.rmtree(d)
            except Exception as e:
                print(f"Warning: Could not remove {d}: {e}")
                # Try to continue anyway, maybe setup.py can overwrite


def build_package():
    """Builds the package using setup.py."""
    print("Building package...")
    try:
        subprocess.check_call([sys.executable, "setup.py", "sdist", "bdist_wheel"])
        print("Build successful!")
    except subprocess.CalledProcessError as e:
        print(f"Build failed: {e}")
        sys.exit(1)

def verify_build():
    """Verifies that the wheel file was created."""
    print("Verifying build...")
    if not os.path.exists("dist"):
        print("Error: dist directory not found.")
        sys.exit(1)
        
    files = os.listdir("dist")
    wheel_file = next((f for f in files if f.endswith(".whl")), None)
    
    if wheel_file:
        print(f"Found wheel file: {wheel_file}")
    else:
        print("Error: No wheel file found in dist.")
        sys.exit(1)

if __name__ == "__main__":
    # Ensure we are in the project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)
    
    clean_build_artifacts()
    build_package()
    verify_build()
