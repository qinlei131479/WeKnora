from dotenv import load_dotenv

# Do not override container/docker-env.agent-harness.sh values. An empty POSTGRES_URL=
# in a bind-mounted .env would otherwise wipe the filled connection string.
load_dotenv(".env", override=False)

from concurrent.futures import ThreadPoolExecutor  # noqa: E402

from yuxi.config import config as config  # noqa: E402

try:
    from importlib.metadata import version

    __version__ = version("yuxi")
except Exception:
    __version__ = "unknown"

executor = ThreadPoolExecutor()  # noqa: E402


def get_version():
    """Return the Yuxi version."""
    return __version__
