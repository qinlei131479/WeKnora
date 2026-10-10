from .backend import ProvisionerSandboxBackend
from .paths import (
    VIRTUAL_PATH_PREFIX,
    ensure_global_saved_artifacts_dir,
    ensure_thread_dirs,
    ensure_workspace_default_files,
    existing_global_saved_artifacts_dir,
    global_user_data_dir,
    resolve_legacy_saved_artifact_fallback,
    resolve_virtual_path,
    sandbox_outputs_dir,
    sandbox_uploads_dir,
    sandbox_user_data_dir,
    sandbox_workspace_agent_context_file,
    sandbox_workspace_dir,
    validate_thread_id,
    virtual_path_for_thread_file,
)
from .provider import (
    ProvisionerSandboxProvider,
    SandboxConnection,
    get_sandbox_provider,
    init_sandbox_provider,
    sandbox_id_for_thread,
    shutdown_sandbox_provider,
)

# Sandbox-visible paths for viewer/filesystem services.
USER_DATA_PATH = VIRTUAL_PATH_PREFIX
SKILLS_PATH = "/home/gem/skills"

__all__ = [
    "ProvisionerSandboxBackend",
    "ProvisionerSandboxProvider",
    "SandboxConnection",
    "VIRTUAL_PATH_PREFIX",
    "ensure_global_saved_artifacts_dir",
    "ensure_thread_dirs",
    "ensure_workspace_default_files",
    "existing_global_saved_artifacts_dir",
    "global_user_data_dir",
    "get_sandbox_provider",
    "init_sandbox_provider",
    "resolve_legacy_saved_artifact_fallback",
    "resolve_virtual_path",
    "sandbox_id_for_thread",
    "sandbox_outputs_dir",
    "sandbox_uploads_dir",
    "sandbox_user_data_dir",
    "sandbox_workspace_agent_context_file",
    "sandbox_workspace_dir",
    "shutdown_sandbox_provider",
    "validate_thread_id",
    "virtual_path_for_thread_file",
    "USER_DATA_PATH",
    "SKILLS_PATH",
]
