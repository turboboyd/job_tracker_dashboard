"""Unit tests for LocalStorageAdapter.

No database required — these tests exercise only the filesystem adapter.
All I/O is isolated to a pytest tmp_path directory.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app.modules.documents.storage import LocalStorageAdapter


@pytest.fixture
def adapter(tmp_path: Path) -> LocalStorageAdapter:
    return LocalStorageAdapter(tmp_path)


async def test_save_and_load(adapter: LocalStorageAdapter) -> None:
    data = b"hello world"
    await adapter.save("test/file.txt", data)
    assert await adapter.load("test/file.txt") == data


async def test_load_missing_raises_file_not_found(adapter: LocalStorageAdapter) -> None:
    with pytest.raises(FileNotFoundError):
        await adapter.load("nonexistent/file.txt")


async def test_delete_existing(adapter: LocalStorageAdapter, tmp_path: Path) -> None:
    await adapter.save("to/delete.txt", b"delete me")
    await adapter.delete("to/delete.txt")
    assert not (tmp_path / "to" / "delete.txt").exists()


async def test_delete_missing_is_noop(adapter: LocalStorageAdapter) -> None:
    await adapter.delete("does/not/exist.txt")  # must not raise


async def test_nested_dirs_created_automatically(
    adapter: LocalStorageAdapter, tmp_path: Path
) -> None:
    key = "a/b/c/d/file.pdf"
    await adapter.save(key, b"deep")
    assert (tmp_path / key).exists()


async def test_overwrite_existing(adapter: LocalStorageAdapter) -> None:
    await adapter.save("file.txt", b"v1")
    await adapter.save("file.txt", b"v2")
    assert await adapter.load("file.txt") == b"v2"
