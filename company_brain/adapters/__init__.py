from .base import BaseAdapter
from .jira_adapter import JiraAdapter
from .confluence_adapter import ConfluenceAdapter
from .github_adapter import GithubAdapter
from .leanix_adapter import LeanixAdapter
from .sharepoint_adapter import SharepointAdapter
from .teams_adapter import TeamsAdapter
from .servicenow_adapter import ServicenowAdapter

ADAPTERS = {
    "jira": JiraAdapter,
    "confluence": ConfluenceAdapter,
    "github": GithubAdapter,
    "leanix": LeanixAdapter,
    "sharepoint": SharepointAdapter,
    "teams": TeamsAdapter,
    "servicenow": ServicenowAdapter
}

def get_adapter(source_system: str, *args, **kwargs) -> BaseAdapter:
    adapter_cls = ADAPTERS.get(source_system.lower())
    if not adapter_cls:
        raise ValueError(f"Unknown adapter source_system: {source_system}")
    return adapter_cls(*args, **kwargs)
