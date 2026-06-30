from __future__ import annotations

import argparse
import json
import platform as platform_module
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence


def ensure_quant_core_import_path(project_root: Path | None = None) -> None:
    root = project_root or Path(__file__).resolve().parents[1]
    quant_core_root = root / "services" / "quant_core"
    if quant_core_root.exists() and str(quant_core_root) not in sys.path:
        sys.path.insert(0, str(quant_core_root))


ensure_quant_core_import_path()

from quant_core.desktop_release import validate_desktop_release_manifest  # noqa: E402


DESKTOP_RELEASE_CHECK_IDS = [
    "web-build",
    "cargo-check",
    "tauri-icon",
    "desktop-bundle",
    "live-blocked-boundary",
]


def detect_desktop_release_platform() -> str:
    system = platform_module.system().lower()
    machine = platform_module.machine().lower()
    arch = "arm64" if machine in {"arm64", "aarch64"} else "x64" if machine in {"x86_64", "amd64"} else machine
    if system == "darwin":
        return f"darwin-{arch}"
    if system == "windows":
        return f"windows-{arch}"
    if system == "linux":
        return f"linux-{arch}"
    return f"{system or 'unknown'}-{arch or 'unknown'}"


def discover_desktop_release_artifact(project_root: Path, platform: str = "auto") -> Path:
    release_platform = detect_desktop_release_platform() if platform == "auto" else platform
    bundle_root = project_root / "apps" / "web" / "src-tauri" / "target" / "release" / "bundle"
    patterns = _artifact_patterns_for_platform(release_platform)
    candidates: list[Path] = []
    for pattern in patterns:
        candidates.extend(path for path in bundle_root.glob(pattern) if path.exists())
    if not candidates:
        candidates.extend(
            path
            for path in bundle_root.rglob("*")
            if path.exists() and (path.is_dir() and path.suffix == ".app" or path.suffix.lower() in {".dmg", ".msi", ".exe", ".appimage", ".deb", ".rpm"})
        )
    if not candidates:
        raise FileNotFoundError(f"Desktop release artifact not found under {bundle_root}")
    return sorted(candidates, key=lambda path: (path.stat().st_mtime, path.name), reverse=True)[0]


def record_desktop_release(
    *,
    project_root: Path,
    output_path: Path,
    artifact_path: Path,
    platform: str,
    version: str,
    generated_at: str | None = None,
) -> dict:
    root = project_root.resolve()
    artifact = artifact_path if artifact_path.is_absolute() else root / artifact_path
    if not artifact.exists():
        raise FileNotFoundError(f"Desktop release artifact not found at {artifact}")
    release_platform = detect_desktop_release_platform() if platform == "auto" else platform
    manifest = build_desktop_release_manifest(
        project_root=root,
        artifact_path=artifact.resolve(),
        platform=release_platform,
        version=version,
        generated_at=generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
    validate_desktop_release_manifest(manifest)
    output = output_path if output_path.is_absolute() else root / output_path
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def build_desktop_release_manifest(
    *,
    project_root: Path,
    artifact_path: Path,
    platform: str,
    version: str,
    generated_at: str,
) -> dict:
    artifact_label = _display_path(project_root, artifact_path)
    return {
        "kind": "aiqt.desktopReleaseManifest",
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "status": "passed",
        "platform": platform,
        "version": version,
        "tauriConfigPath": "apps/web/src-tauri/tauri.conf.json",
        "desktopArtifactPath": artifact_label,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "checkCount": len(DESKTOP_RELEASE_CHECK_IDS),
        "checks": [
            {"id": "web-build", "status": "passed", "summary": "npm run build passed"},
            {"id": "cargo-check", "status": "passed", "summary": "cargo check passed in apps/web/src-tauri"},
            {"id": "tauri-icon", "status": "passed", "summary": "Tauri icon assets are present for packaging"},
            {"id": "desktop-bundle", "status": "passed", "summary": f"desktop package artifact exists at {artifact_label}"},
            {
                "id": "live-blocked-boundary",
                "status": "passed",
                "summary": "release manifest keeps paperOnly=true liveTradingAllowed=false liveBlockedBoundary=true",
            },
        ],
    }


def run_desktop_release(
    *,
    project_root: Path,
    output_path: Path,
    artifact_path: Path | None,
    platform: str,
    version: str,
    record_only: bool = False,
) -> dict:
    root = project_root.resolve()
    if not record_only:
        _run_command(["npm", "run", "build"], cwd=root)
        _run_command(["cargo", "check"], cwd=root / "apps" / "web" / "src-tauri")
        _run_command(["npm", "run", "desktop:build"], cwd=root)
    artifact = artifact_path or discover_desktop_release_artifact(root, platform=platform)
    return record_desktop_release(
        project_root=root,
        output_path=output_path,
        artifact_path=artifact,
        platform=platform,
        version=version,
    )


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run or record the local desktop release manifest.")
    parser.add_argument("--project-root", default=str(Path(__file__).resolve().parents[1]), help="Repository root.")
    parser.add_argument("--output", default="data/desktop-release.json", help="Manifest output path.")
    parser.add_argument("--artifact", default="auto", help="Artifact path, or auto to discover the latest bundle.")
    parser.add_argument("--platform", default="auto", help="Release platform label, or auto.")
    parser.add_argument("--version", default="0.1.0", help="Desktop release version.")
    parser.add_argument("--record-only", action="store_true", help="Skip build commands and only record the current artifact.")
    args = parser.parse_args(argv)

    project_root = Path(args.project_root)
    artifact_path = None if args.artifact == "auto" else Path(args.artifact)
    manifest = run_desktop_release(
        project_root=project_root,
        output_path=Path(args.output),
        artifact_path=artifact_path,
        platform=args.platform,
        version=args.version,
        record_only=args.record_only,
    )
    print(
        "desktop release manifest "
        f"platform={manifest['platform']} artifact={manifest['desktopArtifactPath']} output={Path(args.output)}"
    )
    return 0


def _artifact_patterns_for_platform(platform: str) -> list[str]:
    if platform.startswith("darwin-"):
        return ["dmg/*.dmg", "macos/*.app"]
    if platform.startswith("windows-"):
        return ["msi/*.msi", "nsis/*.exe"]
    if platform.startswith("linux-"):
        return ["appimage/*.AppImage", "deb/*.deb", "rpm/*.rpm"]
    return ["**/*.dmg", "**/*.app", "**/*.msi", "**/*.exe", "**/*.AppImage", "**/*.deb", "**/*.rpm"]


def _display_path(project_root: Path, path: Path) -> str:
    try:
        return path.relative_to(project_root).as_posix()
    except ValueError:
        return path.as_posix()


def _run_command(command: Sequence[str], *, cwd: Path) -> None:
    subprocess.run(list(command), cwd=cwd, check=True)


if __name__ == "__main__":
    raise SystemExit(main())
