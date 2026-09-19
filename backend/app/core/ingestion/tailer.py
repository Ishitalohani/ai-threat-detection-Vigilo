"""
©AngelaMos | 2026
tailer.py

Watchdog-based nginx log file tailer with rotation
detection and position persistence pushing raw lines
into an asyncio queue.
"""

import asyncio
import json
import logging
import os
from io import TextIOWrapper
from pathlib import Path

from watchdog.events import (
    FileCreatedEvent,
    FileModifiedEvent,
    FileMovedEvent,
    FileSystemEventHandler,
)
from watchdog.observers.polling import PollingObserver

logger = logging.getLogger(__name__)


class _LogHandler(FileSystemEventHandler):
    """
    Watchdog event handler that detects modifications and log rotation
    for a single target file, pushing new lines into an asyncio.Queue.
    """

    def __init__(
        self,
        target: str,
        queue: asyncio.Queue[str | None],
        loop: asyncio.AbstractEventLoop,
        position_path: Path | None = None,
    ) -> None:
        super().__init__()
        self._target = target
        self._queue = queue
        self._loop = loop
        self._file: TextIOWrapper | None = None
        self._inode: int | None = None
        self._position_path = position_path
        self._open_target()

    def _open_target(self) -> None:
        """
        Open the target log file.

        If the file does not exist yet, wait for its creation.
        """
        try:
            self._file = open(
                self._target,
                encoding="utf-8",
                errors="replace",
            )

            self._inode = os.stat(self._target).st_ino

            saved = self._load_position()

            if saved is not None and saved["inode"] == self._inode:
                self._file.seek(saved["offset"])

                logger.info(
                    "Tailing %s (inode %s) resumed at offset %d",
                    self._target,
                    self._inode,
                    saved["offset"],
                )
            else:
                self._file.seek(0, os.SEEK_END)

                logger.info(
                    "Tailing %s (inode %s) from EOF",
                    self._target,
                    self._inode,
                )

        except FileNotFoundError:
            logger.warning(
                "Log file %s not found — waiting for creation",
                self._target,
            )

            self._file = None
            self._inode = None

    def _load_position(self) -> dict[str, int] | None:
        """
        Read saved inode and offset from the position file.
        """
        if self._position_path is None:
            return None

        try:
            data = json.loads(
                self._position_path.read_text(
                    encoding="utf-8",
                ),
            )

            return {
                "inode": data["inode"],
                "offset": data["offset"],
            }

        except (
            FileNotFoundError,
            KeyError,
            json.JSONDecodeError,
        ):
            return None

    def _save_position(self) -> None:
        """
        Persist current inode and file offset.
        """
        if (
            self._position_path is None
            or self._file is None
            or self._inode is None
        ):
            return

        try:
            self._position_path.write_text(
                json.dumps(
                    {
                        "inode": self._inode,
                        "offset": self._file.tell(),
                    }
                ),
                encoding="utf-8",
            )

        except OSError:
            logger.debug("Failed to save tailer position")

    def _enqueue(self, line: str) -> None:
        """
        Push one line into the asyncio queue.
        """
        try:
            self._queue.put_nowait(line)

        except asyncio.QueueFull:
            logger.warning(
                "Raw queue full — log line dropped"
            )

    def _read_new_lines(self) -> None:
        """
        Read all new complete lines from the current file position.
        """
        if self._file is None:
            return

        for line in self._file:
            stripped = line.rstrip("\n\r")

            if stripped:
                self._loop.call_soon_threadsafe(
                    self._enqueue,
                    stripped,
                )

        self._save_position()

    def _open_new_file(self) -> None:
        """
        Open a newly created nginx access log and read it
        from the beginning.
        """
        try:
            if self._file is not None:
                self._file.close()

            self._file = open(
                self._target,
                encoding="utf-8",
                errors="replace",
            )

            self._inode = os.stat(self._target).st_ino

            # New log file: process existing lines.
            self._file.seek(0)

            logger.info(
                "Tailing newly created %s (inode %s) from beginning",
                self._target,
                self._inode,
            )

            self._read_new_lines()

        except FileNotFoundError:
            self._file = None
            self._inode = None

    def _handle_rotation(self) -> None:
        """
        Handle nginx log rotation.
        """
        self._read_new_lines()

        if self._file is not None:
            self._file.close()

        self._file = None
        self._inode = None

        self._open_new_file()

    def _inode_changed(self) -> bool:
        """
        Check whether the target file inode has changed.
        """
        try:
            current_inode = os.stat(
                self._target
            ).st_ino

            return current_inode != self._inode

        except FileNotFoundError:
            return False

    def on_modified(
        self,
        event: FileModifiedEvent,
    ) -> None:
        """
        Handle new data appended to the nginx log.
        """
        if not isinstance(
            event,
            FileModifiedEvent,
        ) or event.is_directory:
            return

        if (
            Path(str(event.src_path)).resolve()
            != Path(self._target).resolve()
        ):
            return

        if self._file is None:
            self._open_new_file()
            return

        if self._inode_changed():
            self._handle_rotation()
            return

        self._read_new_lines()

    def on_moved(
        self,
        event: FileMovedEvent,
    ) -> None:
        """
        Handle rename-based log rotation.
        """
        if not isinstance(
            event,
            FileMovedEvent,
        ):
            return

        if (
            Path(str(event.src_path)).resolve()
            == Path(self._target).resolve()
        ):
            logger.info(
                "Log rotated: %s -> %s",
                event.src_path,
                event.dest_path,
            )

            self._handle_rotation()

    def on_created(
        self,
        event: FileCreatedEvent,
    ) -> None:
        """
        Handle creation of the nginx access log.
        """
        if not isinstance(
            event,
            FileCreatedEvent,
        ) or event.is_directory:
            return

        if (
            Path(str(event.src_path)).resolve()
            != Path(self._target).resolve()
        ):
            return

        logger.info(
            "New log file created: %s",
            event.src_path,
        )

        self._open_new_file()

    def close(self) -> None:
        """
        Close the underlying file handle.
        """
        if self._file is not None:
            self._file.close()

            self._file = None


class LogTailer:
    """
    Watchdog-based nginx log tailer that pushes raw lines
    into an asyncio.Queue.
    """

    def __init__(
        self,
        log_path: str,
        queue: asyncio.Queue[str | None],
        loop: asyncio.AbstractEventLoop,
        position_path: Path | None = None,
    ) -> None:
        self._log_path = log_path

        self._handler = _LogHandler(
            log_path,
            queue,
            loop,
            position_path,
        )

        self._observer = PollingObserver(
            timeout=2
        )

        self._started = False

    def start(self) -> None:
        """
        Begin watching the nginx log directory.
        """
        watch_dir = str(
            Path(self._log_path).resolve().parent
        )

        self._observer.schedule(
            self._handler,
            watch_dir,
            recursive=False,
        )

        self._observer.start()

        self._started = True

        logger.info(
            "LogTailer started — watching %s",
            watch_dir,
        )

    def stop(self) -> None:
        """
        Stop the watchdog observer.
        """
        if self._started:
            self._observer.stop()
            self._observer.join(timeout=5)
            self._started = False

        self._handler.close()

        logger.info("LogTailer stopped")

    @property
    def is_active(self) -> bool:
        """
        Whether the tailer is currently running.
        """
        return (
            self._started
            and self._observer.is_alive()
        )