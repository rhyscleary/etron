import os
import shutil
import subprocess
import glob

# === CONFIGURATION ===
# Root directory of your project
PROJECT_ROOT = r"C:\Users\rhysj\Documents\321 Project\etron\backend"

# List of subfolders (relative to PROJECT_ROOT) to check
TARGET_FOLDERS = [
    "user/functions/user-core",
    "user/functions/user-invites",
    "workspace/functions/workspace-core",
    "workspace/functions/workspace-invites",
    "workspace/functions/workspace-modules",
    "workspace/functions/workspace-profiles",
    "workspace/functions/workspace-roles",
    "workspace/functions/workspace-users",
    "modules/day-book/data-sources",
    "modules/day-book/metrics"
]

SHARED_FOLDER = "shared"

shared_path = os.path.join(PROJECT_ROOT, SHARED_FOLDER)

if os.path.exists(shared_path):
    print(f"=== Processing shared tgz in: {shared_path} ===")

    # Remove any existing .tgz files
    tgz_files = glob.glob(os.path.join(shared_path, "*.tgz"))
    for tgz in tgz_files:
        print(f"🗑 Removing {tgz} ...")
        os.remove(tgz)

    # Run npm pack
    print("📦 Running npm pack in shared...")
    subprocess.run(["npm", "pack"], cwd=shared_path, shell=True)
else:
    print(f"❌ Shared folder not found: {shared_path}")

# === SCRIPT ===
for folder in TARGET_FOLDERS:
    folder_path = os.path.join(PROJECT_ROOT, folder)

    if not os.path.exists(folder_path):
        print(f"❌ Skipping {folder} (does not exist)")
        continue

    print(f"\n=== Processing: {folder_path} ===")

    # Remove node_modules if it exists
    node_modules_path = os.path.join(folder_path, "node_modules")
    if os.path.exists(node_modules_path):
        print(f"🗑 Removing {node_modules_path} ...")
        shutil.rmtree(node_modules_path)
    else:
        print("ℹ No node_modules found.")

    # Remove package-lock.json if it exists
    package_lock_path = os.path.join(folder_path, "package-lock.json")
    if os.path.exists(package_lock_path):
        print(f"🗑 Removing {package_lock_path} ...")
        os.remove(package_lock_path)
    else:
        print("ℹ No package-lock.json found.")

    # Run npm install
    print("📦 Running npm install...")
    subprocess.run(["npm", "install"], cwd=folder_path, shell=True)

print("\n✅ All done!")
