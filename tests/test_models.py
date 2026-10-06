"""
Tests for Company Brain data models and entity resolution.
"""
import pytest
from company_brain.models.entity import (
    EntityType, RelationshipType, NormalizedRecord,
    ProjectEntity, IssueEntity, DecisionEntity, ApplicationEntity,
)
from company_brain.models.evidence import Evidence, SourceItem


class TestEntityTypes:
    """Test entity type definitions."""

    def test_entity_type_enum_has_12_types(self):
        """Company Brain uses exactly 12 entity types."""
        expected = {
            'PROJECT', 'DEPARTMENT', 'DOMAIN', 'PERSON',
            'APPLICATION', 'DECISION', 'DOCUMENT', 'ISSUE',
            'RELEASE', 'MEETING', 'CHANGE', 'ACTION',
        }
        actual = {e.value for e in EntityType}
        assert expected == actual, f"Missing: {expected - actual}, Extra: {actual - expected}"

    def test_relationship_type_enum(self):
        """All required relationship types are defined."""
        required = {
            'HAS_DOCUMENT', 'HAS_MEETING', 'HAS_CHANGE', 'HAS_RELEASE',
            'DEPENDS_ON', 'CONNECTS_VIA', 'HAS_INCIDENT', 'AFFECTS',
            'RECORDED_IN', 'DISCUSSED_IN', 'BLOCKS', 'IMPLEMENTS',
            'DEPLOYS', 'APPROVES', 'USED_BY', 'OWNS',
        }
        actual = {r.value for r in RelationshipType}
        assert required.issubset(actual), f"Missing: {required - actual}"


class TestNormalizedRecord:
    """Test the common normalized adapter contract."""

    def test_create_normalized_record(self):
        record = NormalizedRecord(
            source_system='jira',
            source_record_id='ATL-1',
            source_url='https://company-brain.atlassian.net/browse/ATL-1',
            record_type='issue',
            project_id='ATLAS',
            title='Supplier Integration Modernization',
            content={'summary': 'Epic for supplier integration'},
            content_hash='abc123',
            classification='Internal',
            allowed_roles=['project_manager', 'developer', 'architect', 'support'],
        )
        assert record.source_system == 'jira'
        assert record.project_id == 'ATLAS'
        assert record.classification == 'Internal'

    def test_normalized_record_requires_hash(self):
        """Content hash is mandatory for incremental sync."""
        with pytest.raises(Exception):
            NormalizedRecord(
                source_system='jira',
                source_record_id='ATL-1',
                record_type='issue',
                project_id='ATLAS',
                title='Test',
                content={},
                # missing content_hash
            )


class TestEvidence:
    """Test evidence model."""

    def test_evidence_requires_target(self):
        """Evidence must reference either an entity or a relationship."""
        evidence = Evidence(
            entity_id='APPLICATION:ORDER-HUB',
            source_item_id='jira:ATL-1',
            statements='Order Hub application is actively maintained',
            authority='operational',
            confidence=0.9,
            allowed_roles=['project_manager', 'developer'],
        )
        assert evidence.authority == 'operational'
        assert evidence.confidence == 0.9


class TestSourceItem:
    """Test source item model."""

    def test_source_item_creation(self):
        item = SourceItem(
            source_item_id='jira:ATL-4',
            source_system='jira',
            source_record_id='ATL-4',
            source_url='https://company-brain.atlassian.net/browse/ATL-4',
            record_type='issue',
            project_id='ATLAS',
            content={
                'summary': 'OAuth authentication defect',
                'status': 'Open',
                'priority': 'Critical',
            },
            content_hash='def456',
            classification='Internal',
            allowed_roles=['project_manager', 'developer', 'architect', 'support'],
        )
        assert item.source_system == 'jira'
        assert item.content['priority'] == 'Critical'
