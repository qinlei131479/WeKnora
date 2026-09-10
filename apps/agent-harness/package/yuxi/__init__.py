from concurrent.futures import ThreadPoolExecutor

from yuxi.config import config as config

try:
    from importlib.metadata import version

    __version__ = version("yuxi")
except Exception:
    __version__ = "unknown"

executor = ThreadPoolExecutor()


def get_version():
    """Return the Yuxi version."""
    return __version__
