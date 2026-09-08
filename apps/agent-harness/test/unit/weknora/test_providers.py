from __future__ import annotations

import pytest
from fastapi import HTTPException

from server.routers import model_provider_router as router


def test_provider_writes_forbidden():
    with pytest.raises(HTTPException) as exc:
        router._reject_yuxi_provider_writes()
    assert exc.value.status_code == 403
