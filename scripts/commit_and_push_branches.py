#!/usr/bin/env python3
import os
import subprocess
import sys
from pathlib import Path

def run_cmd(args, check=True):
    res = subprocess.run(args, capture_output=True, text=True)
    if check and res.returncode != 0:
        print(f"Command failed: {' '.join(args)}\nError: {res.stderr}", file=sys.stderr)
        raise RuntimeError(res.stderr)
    return res

def get_untracked_files():
    res = run_cmd(["git", "ls-files", "-o", "--exclude-standard"])
    lines = [line.strip() for line in res.stdout.splitlines() if line.strip()]
    return sorted(lines)

def categorize_file(fpath):
    if fpath.startswith("packages/config/"):
        return "packages-config", "packages/config", "packages/config"
    elif fpath.startswith("packages/ui-tokens/"):
        return "packages-ui-tokens", "packages/ui-tokens", "packages/ui-tokens"
    elif fpath.startswith("packages/contracts/"):
        return "packages-contracts", "packages/contracts", "packages/contracts"
    elif fpath.startswith("packages/domain/"):
        return "packages-domain", "packages/domain", "packages/domain"
    elif fpath.startswith("apps/api/"):
        return "apps-api", "apps/api", "apps/api"
    elif fpath.startswith("apps/admin/"):
        return "apps-admin", "apps/admin", "apps/admin"
    elif fpath.startswith("apps/mobile/"):
        return "apps-mobile", "apps/mobile", "apps/mobile"
    elif fpath.startswith("scripts/"):
        return "tooling-scripts", "scripts", "scripts"
    elif any(fpath.startswith(prefix) for prefix in ["admindesign/", "image (2)/", "folder", "mastara_software_requirements_specification"]):
        return "docs-specs-and-design", "docs", "documentation and design specifications"
    else:
        return "root-tooling-and-config", "setup", "root configuration and workspace tooling"

def main():
    print("=" * 60)
    print("Mastera Contribution Committer & Branch Pusher")
    print("=" * 60)

    # Ensure master branch
    run_cmd(["git", "checkout", "-B", "master"])

    files = get_untracked_files()
    print(f"Discovered {len(files)} files to commit.")

    # Group files
    groups = {}
    for f in files:
        key, scope, desc = categorize_file(f)
        if key not in groups:
            groups[key] = {"scope": scope, "desc": desc, "files": []}
        groups[key]["files"].append(f)

    # Defined order of branches
    group_order = [
        "root-tooling-and-config",
        "packages-config",
        "packages-ui-tokens",
        "packages-contracts",
        "packages-domain",
        "tooling-scripts",
        "apps-api",
        "apps-admin",
        "apps-mobile",
        "docs-specs-and-design",
    ]

    total_committed = 0
    created_branches = []

    for group_key in group_order:
        if group_key not in groups:
            continue
        group_data = groups[group_key]
        group_files = group_data["files"]
        scope = group_data["scope"]
        branch_name = f"branch/{group_key}"

        print(f"\n--> Creating branch '{branch_name}' for {group_data['desc']} ({len(group_files)} files)...")
        run_cmd(["git", "checkout", "master"])
        run_cmd(["git", "checkout", "-b", branch_name])
        created_branches.append(branch_name)

        for idx, file_path in enumerate(group_files, 1):
            run_cmd(["git", "add", file_path])
            commit_msg = f"feat({scope}): add {Path(file_path).name}\n\nPath: {file_path}"
            run_cmd(["git", "commit", "-m", commit_msg])
            total_committed += 1
            if idx % 20 == 0 or idx == len(group_files):
                print(f"    [{idx}/{len(group_files)}] committed {file_path}")

        # Merge branch into master
        print(f"--> Merging '{branch_name}' into 'master'...")
        run_cmd(["git", "checkout", "master"])
        run_cmd(["git", "merge", branch_name, "--no-ff", "-m", f"merge({scope}): integrate {branch_name} into master"])

    print("\n" + "=" * 60)
    print(f"SUCCESS: Created {total_committed} file-by-file commits across {len(created_branches)} branches!")
    print("=" * 60)

    # Push all branches
    print("\n--> Attempting to push branches and master to origin...")
    push_res = subprocess.run(["git", "push", "origin", "--all"], capture_output=True, text=True)
    if push_res.returncode == 0:
        print("--> Successfully pushed all branches to origin!")
        subprocess.run(["git", "push", "origin", "--tags"])
    else:
        print("\nNotice: 'git push' requires your GitHub authentication.")
        print(push_res.stderr.strip() if push_res.stderr else push_res.stdout.strip())
        print("\nAll commits and branches have been generated locally.")
        print("To push to GitHub, authenticate with ONE of:")
        print("  1. Add SSH key to GitHub (https://github.com/settings/keys):")
        print("     git remote set-url origin git@github.com:Daniel21Ayen/mastera.git")
        print("     git push origin --all")
        print("  2. Or sign in via GitHub CLI:")
        print("     gh auth login")
        print("     git push origin --all")

if __name__ == "__main__":
    main()
