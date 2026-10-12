import logging

from yuxi.utils.logging_config import service_log_prefix


def setup_logging() -> None:
    log_prefix = service_log_prefix()
    logging.basicConfig(
        level=logging.INFO,
        format=f"%(asctime)s %(levelname)s: {log_prefix}%(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        force=True,
    )

    uvicorn_logger = logging.getLogger("uvicorn")
    logging.getLogger("uvicorn.access").handlers.clear()

    formatter = logging.Formatter(
        fmt=f"%(asctime)s %(levelname)s: {log_prefix}%(message)s", datefmt="%m-%d %H:%M:%S"
    )
    for handler in uvicorn_logger.handlers:
        handler.setFormatter(formatter)
