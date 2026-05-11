"""Export the backend OpenAPI schema to docs/openapi/backend-openapi.json.

Run from the backend directory:
    python -m scripts.export_openapi
    # or
    python scripts/export_openapi.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import create_app

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_OUT = _REPO_ROOT / "docs" / "openapi" / "backend-openapi.json"


def main() -> None:
    app = create_app()
    schema = app.openapi()
    _OUT.parent.mkdir(parents=True, exist_ok=True)
    _OUT.write_text(json.dumps(schema, indent=2), encoding="utf-8")
    paths = list(schema.get("paths", {}).keys())
    print(f"OpenAPI schema exported to {_OUT}")
    print(f"  info.title:   {schema['info']['title']}")
    print(f"  info.version: {schema['info']['version']}")
    print(f"  paths ({len(paths)}):")
    for p in sorted(paths):
        methods = ", ".join(schema["paths"][p].keys()).upper()
        print(f"    {p}  [{methods}]")


if __name__ == "__main__":
    main()
