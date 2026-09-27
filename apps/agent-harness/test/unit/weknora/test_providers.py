from server.routers import model_provider_router as router


def test_provider_writes_forbidden():
    routes = {(route.path, tuple(sorted(route.methods))) for route in router.model_providers.routes}
    assert routes == {("/system/model-providers/models/v2", ("GET",))}
