from __future__ import annotations

import asyncio
from pathlib import Path

from app.core.config import get_settings


class LocalStorageAdapter:
    def __init__(self, root: Path) -> None:
        self._root = root

    def _full_path(self, key: str) -> Path:
        return self._root / key

    async def save(self, key: str, data: bytes) -> None:
        path = self._full_path(key)
        await asyncio.to_thread(self._sync_save, path, data)

    def _sync_save(self, path: Path, data: bytes) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    async def load(self, key: str) -> bytes:
        path = self._full_path(key)
        if not await asyncio.to_thread(path.exists):
            raise FileNotFoundError(key)
        return await asyncio.to_thread(path.read_bytes)

    async def delete(self, key: str) -> None:
        path = self._full_path(key)
        await asyncio.to_thread(self._sync_delete, path)

    def _sync_delete(self, path: Path) -> None:
        if path.exists():
            path.unlink()


def get_storage_adapter() -> LocalStorageAdapter:
    settings = get_settings()
    return LocalStorageAdapter(Path(settings.DOCUMENT_STORAGE_ROOT))
