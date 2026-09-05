#!/usr/bin/env python3
import hashlib
import json
import shutil
import stat
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTENSION_ROOT = ROOT / "chrome-extension"
DIST = ROOT / "dist"
ZIP_NAME = "ChatPulse-Chrome-v0.7.4-beta.zip"
MANIFEST_NAME = "ChatPulse-Chrome-v0.7.4-source-manifest.txt"
FIXED_ZIP_TIME = (2020, 1, 1, 0, 0, 0)
EXCLUDED_PARTS = {"node_modules", "__pycache__"}
EXCLUDED_NAMES = {".DS_Store"}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def release_files():
    files = []
    for path in EXTENSION_ROOT.rglob("*"):
        relative = path.relative_to(EXTENSION_ROOT)
        if any(part in EXCLUDED_PARTS for part in relative.parts) or path.name in EXCLUDED_NAMES:
            continue
        if path.is_symlink():
            raise SystemExit(f"Symlink is not allowed in extension package: {relative}")
        if path.is_dir():
            continue
        if not path.is_file():
            raise SystemExit(f"Non-regular file is not allowed: {relative}")
        files.append((relative.as_posix(), path))
    files.sort(key=lambda item: item[0])
    if not files:
        raise SystemExit("Extension package is empty")
    return files


def main():
    files = release_files()
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    manifest_lines = []
    payloads = {}
    for relative, path in files:
        data = path.read_bytes()
        payloads[relative] = data
        manifest_lines.append(f"{relative}\t{len(data)}\t{sha256(data)}")

    manifest_bytes = ("\n".join(manifest_lines) + "\n").encode("utf-8")
    manifest_path = DIST / MANIFEST_NAME
    manifest_path.write_bytes(manifest_bytes)
    manifest_sha = sha256(manifest_bytes)
    (DIST / f"{MANIFEST_NAME}.sha256").write_text(
        f"{manifest_sha}  {MANIFEST_NAME}\n",
        encoding="utf-8",
    )

    zip_path = DIST / ZIP_NAME
    with zipfile.ZipFile(
        zip_path,
        "w",
        compression=zipfile.ZIP_DEFLATED,
        compresslevel=9,
        strict_timestamps=True,
    ) as archive:
        for relative, _path in files:
            info = zipfile.ZipInfo(relative, date_time=FIXED_ZIP_TIME)
            info.create_system = 3
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            archive.writestr(info, payloads[relative], compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

    zip_bytes = zip_path.read_bytes()
    zip_sha = sha256(zip_bytes)
    (DIST / f"{ZIP_NAME}.sha256").write_text(
        f"{zip_sha}  {ZIP_NAME}\n",
        encoding="utf-8",
    )

    with zipfile.ZipFile(zip_path, "r") as archive:
        names = archive.namelist()
        expected_names = [relative for relative, _path in files]
        if names != expected_names:
            raise SystemExit("ZIP member order/content does not match canonical source list")
        for relative in expected_names:
            if sha256(archive.read(relative)) != sha256(payloads[relative]):
                raise SystemExit(f"ZIP member verification failed: {relative}")

    print(json.dumps({
        "artifact": ZIP_NAME,
        "artifact_sha256": zip_sha,
        "source_manifest": MANIFEST_NAME,
        "source_manifest_sha256": manifest_sha,
        "file_count": len(files),
        "reproducible_timestamp": "2020-01-01T00:00:00",
    }, indent=2))


if __name__ == "__main__":
    main()
