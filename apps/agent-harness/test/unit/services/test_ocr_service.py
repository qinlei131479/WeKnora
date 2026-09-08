from __future__ import annotations

from yuxi.services import ocr_service


def test_ocr_options_are_weknora_managed():
    options = ocr_service.get_ocr_options()
    assert options["weknora_managed"] is True
    assert options["engines"] == []
    assert options["default_engine"] == "weknora"
