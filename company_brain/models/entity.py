from enum import Enum
from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, Field
from datetime import datetime

class EntityType(str, Enum):
    PROJECT = "PROJECT"
    DEPARTMENT = "DEPARTMENT"
    DOMAIN = "DOMAIN"
    PERSON = "PERSON"
    APPLICATION = "APPLICATION"
    DECISION = "DECISION"
    DOCUMENT = "DOCUMENT"
    ISSUE = "ISSUE"
    RELEASE = "RELEASE"
    MEETING = "MEETING"
    CHANGE = "CHANGE"
    ACTION = "ACTION"

class RelationshipType(str, Enum):
    HAS_DOCUMENT = "HAS_DOCUMENT"
    HAS_MEETING = "HAS_MEETING"
    HAS_CHANGE = "HAS_CHANGE"
    HAS_RELEASE = "HAS_RELEASE"
    DEPENDS_ON = "DEPENDS_ON"
    CONNECTS_VIA = "CONNECTS_VIA"
    HAS_INCIDENT = "HAS_INCIDENT"
    AFFECTS = "AFFECTS"
    RECORDED_IN = "RECORDED_IN"
    DISCUSSED_IN = "DISCUSSED_IN"
    BLOCKS = "BLOCKS"
    IMPLEMENTS = "IMPLEMENTS"
    DEPLOYS = "DEPLOYS"
    APPROVES = "APPROVES"
    USED_BY = "USED_BY"
    OWNS = "OWNS"
    ASSIGNED_TO = "ASSIGNED_TO"
    HAS_BLOCKER = "HAS_BLOCKER"

class NormalizedRecord(BaseModel):
    source_system: str
    source_record_id: str
    source_url: Optional[str] = None
    record_type: str
    project_id: Optional[str] = None
    title: Optional[str] = None
    content: Any = Field(...)
    content_hash: str
    source_created_at: Optional[datetime] = None
    source_updated_at: Optional[datetime] = None
    classification: Optional[str] = "Internal"
    allowed_roles: List[str] = Field(default_factory=list)

class EntityBase(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    entity_type: EntityType
    project_id: Optional[str] = None
    allowed_roles: List[str] = Field(default_factory=list)

class Project(EntityBase):
    entity_type: EntityType = EntityType.PROJECT
    description: Optional[str] = None

class Department(EntityBase):
    entity_type: EntityType = EntityType.DEPARTMENT

class Domain(EntityBase):
    entity_type: EntityType = EntityType.DOMAIN

class Person(EntityBase):
    entity_type: EntityType = EntityType.PERSON
    email: Optional[str] = None

class Application(EntityBase):
    entity_type: EntityType = EntityType.APPLICATION

class Decision(EntityBase):
    entity_type: EntityType = EntityType.DECISION

class Document(EntityBase):
    entity_type: EntityType = EntityType.DOCUMENT
    url: Optional[str] = None

class Issue(EntityBase):
    entity_type: EntityType = EntityType.ISSUE
    status: Optional[str] = None

class Release(EntityBase):
    entity_type: EntityType = EntityType.RELEASE
    version: Optional[str] = None

class Meeting(EntityBase):
    entity_type: EntityType = EntityType.MEETING

class Change(EntityBase):
    entity_type: EntityType = EntityType.CHANGE

class Action(EntityBase):
    entity_type: EntityType = EntityType.ACTION

# Aliases for compatibility
ProjectEntity = Project
DepartmentEntity = Department
DomainEntity = Domain
PersonEntity = Person
ApplicationEntity = Application
DecisionEntity = Decision
DocumentEntity = Document
IssueEntity = Issue
ReleaseEntity = Release
MeetingEntity = Meeting
ChangeEntity = Change
ActionEntity = Action
