from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path

WORKFLOW_ROOT = Path(".github/workflows")
POLICY_WORKFLOW = Path(".github/workflows/docker-runner-policy.yml")
WORKFLOW_PATTERNS = ("*.yml", "*.yaml")
LABEL_ORDER = ("docker", "postgresql", "redis")

JOB_RE = re.compile(r"^  (?P<job>[A-Za-z0-9_.-]+):(?:\s*(?:#.*)?)$")
RUNS_ON_RE = re.compile(r"^    runs-on:\s*(?P<value>.*?)(?:\s+#.*)?$")
JOB_LEVEL_DOCKER_RE = re.compile(r"^    (?:container|services):(?:\s|$)")
USES_RE = re.compile(
    r"^(?P<indent>\s+)(?:-\s+)?uses:\s*(?P<value>.+?)\s*(?:#.*)?$"
)
RUN_RE = re.compile(r"^(?P<indent>\s+)(?:-\s+)?run:\s*(?P<value>.*)$")

DOCKER_COMMAND_RE = re.compile(
    r"""(?ix)
    (?:^|[\s;&|()])
    (?:sudo\s+)?
    docker(?:\s|$)
    |
    (?:^|[\s;&|()])
    docker-compose(?:\s|$)
    |
    \bDOCKER_(?:BUILDKIT|HOST|TLS_VERIFY|CERT_PATH|CONTEXT)\b
    |
    \b(?:make|just|task)\s+[^\n#]*(?:docker|container)
    |
    (?:^|[\s;&|()])
    (?:\./)?[\w./-]*docker[\w./-]*\.(?:sh|py)(?:\s|$)
    """
)
POSTGRES_COMMAND_RE = re.compile(
    r"""(?ix)
    (?:^|[\s;&|()])
    (?:sudo\s+)?
    (?:psql|pg_isready|pg_dump|pg_dumpall|pg_restore|postgres|initdb|createdb|dropdb)
    (?:\s|$)
    |
    (?:docker(?:\s+compose)?|docker-compose)\s+[^\n#]*(?:postgres|postgresql)
    |
    \b(?:make|just|task)\s+[^\n#]*(?:postgres|postgresql)
    |
    postgres(?:ql)?://
    |
    \b(?:POSTGRES_[A-Z0-9_]+|PG(?:HOST|PORT|USER|PASSWORD|DATABASE|SSLMODE))\b
    """
)
REDIS_COMMAND_RE = re.compile(
    r"""(?ix)
    (?:^|[\s;&|()])
    (?:sudo\s+)?
    redis-(?:cli|server|benchmark|sentinel)
    (?:\s|$)
    |
    (?:docker(?:\s+compose)?|docker-compose)\s+[^\n#]*\bredis\b
    |
    \b(?:make|just|task)\s+[^\n#]*\bredis\b
    |
    redis(?:s)?://
    |
    \bREDIS_[A-Z0-9_]+\b
    """
)

POSTGRES_CONFIG_RE = re.compile(
    r"""(?ix)
    ^\s+(?:postgres|postgresql):(?:\s|$)
    |
    ^\s+image:\s*["']?postgres(?:ql)?(?::|@|\s|["']|$)
    |
    ^\s+(?:POSTGRES_[A-Z0-9_]+|PG(?:HOST|PORT|USER|PASSWORD|DATABASE|SSLMODE)):\s*
    |
    postgres(?:ql)?://
    """
)
REDIS_CONFIG_RE = re.compile(
    r"""(?ix)
    ^\s+redis:\s*(?:\s|$)
    |
    ^\s+image:\s*["']?redis(?::|@|\s|["']|$)
    |
    ^\s+REDIS_[A-Z0-9_]+:\s*
    |
    redis(?:s)?://
    """
)

LABEL_RES = {
    label: re.compile(
        rf"(?i)(?:^|[\s,\[\]{{}}'\"-]){re.escape(label)}"
        rf"(?:$|[\s,\[\]{{}}'\"-])"
    )
    for label in LABEL_ORDER
}


@dataclass(frozen=True)
class JobBlock:
    name: str
    lines: list[str]


def _indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _workflow_files(root: Path) -> list[Path]:
    workflow_root = root / WORKFLOW_ROOT
    return sorted(
        path
        for pattern in WORKFLOW_PATTERNS
        for path in workflow_root.glob(pattern)
        if path.is_file() and path.relative_to(root) != POLICY_WORKFLOW
    )


def _job_blocks(text: str) -> list[JobBlock]:
    lines = text.splitlines()
    jobs_index: int | None = None
    for index, line in enumerate(lines):
        if line == "jobs:":
            jobs_index = index
            break
    if jobs_index is None:
        return []

    blocks: list[JobBlock] = []
    current_name: str | None = None
    current_lines: list[str] = []

    for line in lines[jobs_index + 1 :]:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and _indent(line) == 0:
            break

        match = JOB_RE.match(line)
        if match:
            if current_name is not None:
                blocks.append(JobBlock(current_name, current_lines))
            current_name = match.group("job")
            current_lines = [line]
            continue

        if current_name is not None:
            current_lines.append(line)

    if current_name is not None:
        blocks.append(JobBlock(current_name, current_lines))
    return blocks


def _runs_on_selector(lines: list[str]) -> str | None:
    for index, line in enumerate(lines):
        match = RUNS_ON_RE.match(line)
        if not match:
            continue

        value = match.group("value").strip()
        selector_lines = [value] if value else []
        base_indent = _indent(line)
        for continuation in lines[index + 1 :]:
            stripped = continuation.strip()
            if not stripped:
                continue
            if _indent(continuation) <= base_indent:
                break
            selector_lines.append(stripped)
        return " ".join(selector_lines).strip()
    return None


def _run_commands(lines: list[str]) -> list[str]:
    commands: list[str] = []
    for index, line in enumerate(lines):
        run_match = RUN_RE.match(line)
        if not run_match:
            continue

        inline_value = run_match.group("value").strip()
        command_lines: list[str] = []
        if inline_value not in {"", "|", ">", "|-", ">-", "|+", ">+"}:
            command_lines.append(inline_value)

        run_indent = len(run_match.group("indent"))
        for continuation in lines[index + 1 :]:
            stripped = continuation.strip()
            if stripped and _indent(continuation) <= run_indent:
                break
            if stripped and not stripped.startswith("#"):
                command_lines.append(stripped)

        commands.append("\n".join(command_lines))
    return commands


def _docker_evidence(lines: list[str], commands: list[str]) -> str | None:
    for line in lines:
        if JOB_LEVEL_DOCKER_RE.match(line):
            return line.strip()

        uses_match = USES_RE.match(line)
        if uses_match and len(uses_match.group("indent")) >= 6:
            value = uses_match.group("value").strip().strip("\"'")
            normalized = value.lower()
            if normalized.startswith("docker/") or normalized.startswith("docker://"):
                return f"uses: {value}"

    for command in commands:
        if DOCKER_COMMAND_RE.search(command):
            return f"run: {' '.join(command.split())[:160]}"
    return None


def _postgresql_evidence(lines: list[str], commands: list[str]) -> str | None:
    for line in lines:
        if line.lstrip().startswith("#"):
            continue
        if POSTGRES_CONFIG_RE.search(line):
            return line.strip()

        uses_match = USES_RE.match(line)
        if uses_match and len(uses_match.group("indent")) >= 6:
            value = uses_match.group("value").strip().strip("\"'")
            if re.search(r"(?i)postgres(?:ql)?", value):
                return f"uses: {value}"

    for command in commands:
        if POSTGRES_COMMAND_RE.search(command):
            return f"run: {' '.join(command.split())[:160]}"
    return None


def _redis_evidence(lines: list[str], commands: list[str]) -> str | None:
    for line in lines:
        if line.lstrip().startswith("#"):
            continue
        if REDIS_CONFIG_RE.search(line):
            return line.strip()

        uses_match = USES_RE.match(line)
        if uses_match and len(uses_match.group("indent")) >= 6:
            value = uses_match.group("value").strip().strip("\"'")
            if re.search(r"(?i)(?:^|[/_.-])redis(?:[/_.@-]|$)", value):
                return f"uses: {value}"

    for command in commands:
        if REDIS_COMMAND_RE.search(command):
            return f"run: {' '.join(command.split())[:160]}"
    return None


def _dependency_evidence(lines: list[str]) -> dict[str, str]:
    commands = _run_commands(lines)
    evidence: dict[str, str] = {}

    docker = _docker_evidence(lines, commands)
    if docker is not None:
        evidence["docker"] = docker

    postgresql = _postgresql_evidence(lines, commands)
    if postgresql is not None:
        evidence["postgresql"] = postgresql

    redis = _redis_evidence(lines, commands)
    if redis is not None:
        evidence["redis"] = redis

    return evidence


def _recommended_selector(required_labels: list[str]) -> str:
    labels = ", ".join(("self-hosted", *required_labels))
    return f"[{labels}]"


def audit(root: Path) -> list[str]:
    errors: list[str] = []
    for path in _workflow_files(root):
        text = path.read_text(encoding="utf-8")
        relative_path = path.relative_to(root)

        for job in _job_blocks(text):
            evidence = _dependency_evidence(job.lines)
            if not evidence:
                continue

            required_labels = [label for label in LABEL_ORDER if label in evidence]
            selector = _runs_on_selector(job.lines)
            evidence_summary = "; ".join(
                f"{label}: {evidence[label]}" for label in required_labels
            )

            if selector is None:
                errors.append(
                    f"{relative_path}:{job.name}: dependency workload detected "
                    f"({evidence_summary}), but the job has no runs-on selector; use "
                    f"runs-on: {_recommended_selector(required_labels)}"
                )
                continue

            missing_labels = [
                label
                for label in required_labels
                if LABEL_RES[label].search(selector) is None
            ]
            if missing_labels:
                errors.append(
                    f"{relative_path}:{job.name}: dependency workload detected "
                    f"({evidence_summary}), but runs-on is {selector!r}; missing label(s): "
                    f"{', '.join(missing_labels)}. Normally use runs-on: "
                    f"{_recommended_selector(required_labels)}"
                )
    return errors


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    errors = audit(root)
    if errors:
        print("Dependency runner routing violations:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Dependency runner routing policy passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
