from .entity import (
    EntityType, RelationshipType, NormalizedRecord, EntityBase,
    Project, Department, Domain, Person, Application, Decision, 
    Document, Issue, Release, Meeting, Change, Action
)
from .evidence import Evidence, SourceItem
from .resolve import EntityAlias, resolve_entity
from .aliases import EntityAliasDB, register_alias, lookup_alias, deduplicate_aliases

__all__ = [
    "EntityType", "RelationshipType", "NormalizedRecord", "EntityBase",
    "Project", "Department", "Domain", "Person", "Application", "Decision",
    "Document", "Issue", "Release", "Meeting", "Change", "Action",
    "Evidence", "SourceItem",
    "EntityAlias", "resolve_entity",
    "EntityAliasDB", "register_alias", "lookup_alias", "deduplicate_aliases"
]
