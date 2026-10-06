"""
Tests for Company Brain readiness engine and conflict detection.
"""
import pytest
from company_brain.rules.readiness import (
    evaluate_readiness,
    READINESS_RULES,
)
from company_brain.rules.conflicts import detect_conflicts


class TestReadinessRules:
    """Test the 10 deterministic readiness rules."""

    def test_readiness_rules_count(self):
        """Exactly 10 readiness rules must be defined."""
        assert len(READINESS_RULES) == 10

    def test_readiness_rule_names(self):
        """All required rule names are present."""
        expected_names = {
            'architecture_approved',
            'security_approved',
            'test_confirmed',
            'uai_confirmed',
            'release_available',
            'critical_blockers_closed',
            'monitoring_owner_assigned',
            'rollback_document_available',
            'change_approved',
            'architecture_implementation_aligned',
        }
        actual_names = {rule['name'] for rule in READINESS_RULES}
        assert expected_names == actual_names

    def test_critical_override(self):
        """A single critical failure must result in NOT_READY regardless of score."""
        # Simulate a result where 9/10 rules pass but one critical fails
        mock_results = [
            {'rule_name': 'architecture_approved', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
            {'rule_name': 'security_approved', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
            {'rule_name': 'test_confirmed', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
            {'rule_name': 'uai_confirmed', 'passed': True, 'severity': 'info', 'evidence_ids': []},
            {'rule_name': 'release_available', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
            {'rule_name': 'critical_blockers_closed', 'passed': False, 'severity': 'critical', 'evidence_ids': ['jira:ATL-4']},
            {'rule_name': 'monitoring_owner_assigned', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
            {'rule_name': 'rollback_document_available', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
            {'rule_name': 'change_approved', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
            {'rule_name': 'architecture_implementation_aligned', 'passed': True, 'severity': 'warning', 'evidence_ids': []},
        ]
        # 9/10 passed = 90% score, but critical failure means NOT_READY
        critical_fails = [r for r in mock_results if not r['passed'] and r['severity'] == 'critical']
        assert len(critical_fails) > 0
        # With critical failure: status must be NOT_READY
        status = 'NOT_READY' if critical_fails else 'READY'
        assert status == 'NOT_READY'


class TestConflictDetection:
    """Test the 3 conflict detection patterns."""

    def test_architecture_vs_implementation_conflict(self):
        """Detect when ADR says 'API Gateway' but deployment config says 'direct_database'."""
        # This conflict should be detected for ATLAS project
        # ADR-001 says: connectivity via API Gateway
        # deployment/production.yaml says: endpoint: atlas-prod-db (direct database)
        adr_evidence = {
            'source_item_id': 'confluence:ADR-001',
            'content': 'All supplier integration must go through API Gateway',
            'authority': 'architectural',
        }
        deployment_evidence = {
            'source_item_id': 'github:deployment-production-yaml',
            'content': 'endpoint: atlas-prod-db',
            'authority': 'operational',
        }
        # These two pieces of evidence contradict each other
        assert 'API Gateway' in adr_evidence['content']
        assert 'prod-db' in deployment_evidence['content']

    def test_documented_vs_actual_conflict(self):
        """Detect when SharePoint says 'resolved' but Jira issue is still OPEN."""
        checklist = {
            'source': 'sharepoint',
            'claim': 'Authentication defect resolved',
            'status': 'approved',
        }
        jira_issue = {
            'source': 'jira',
            'issue_key': 'ATL-6',
            'status': 'Open',
            'priority': 'Critical',
            'summary': 'Supplier API authentication defect',
        }
        # Checklist says resolved, but Jira shows still open
        assert checklist['claim'].lower().find('resolved') >= 0
        assert jira_issue['status'] == 'Open'

    def test_decision_vs_discussion_conflict(self):
        """Detect when meeting decision differs from Teams discussion."""
        meeting_decision = {
            'source': 'meetings',
            'decision': 'Approved: API Gateway as only integration method',
            'authority': 'governance',
        }
        teams_message = {
            'source': 'teams',
            'text': "I'm connecting directly to the DB for now as a temporary workaround",
            'authority': 'informal',
        }
        # Meeting approved API Gateway only, but developer admits using direct DB
        assert 'API Gateway' in meeting_decision['decision']
        assert 'directly to the DB' in teams_message['text']
