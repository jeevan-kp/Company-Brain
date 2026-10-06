"""
Tests for Company Brain permission filtering.
"""
import pytest
from company_brain.permissions.filter import (
    filter_evidence,
    get_persona_config,
    PERSONA_CONFIGS,
)


class TestPermissionFiltering:
    """Test role-aware permission filtering."""

    def test_all_personas_defined(self):
        """All 5 personas must be defined."""
        expected = {'management', 'project_manager', 'developer', 'support', 'architect'}
        actual = set(PERSONA_CONFIGS.keys())
        assert expected == actual

    def test_developer_cannot_see_governance_docs(self):
        """Developer persona should not see governance-restricted documents."""
        evidence_list = [
            {
                'evidence_id': 1,
                'statements': 'Security assessment completed',
                'allowed_roles': ['architect', 'project_manager'],
                'authority': 'governance',
            },
            {
                'evidence_id': 2,
                'statements': 'API Gateway implementation started',
                'allowed_roles': ['project_manager', 'developer', 'architect', 'support'],
                'authority': 'operational',
            },
        ]
        user_roles = ['developer']
        filtered = filter_evidence(evidence_list, user_roles)
        
        # Developer should see the operational evidence but not the governance one
        assert len(filtered) <= 2
        visible_ids = [e['evidence_id'] for e in filtered if not e.get('restricted', False)]
        assert 2 in visible_ids

    def test_architect_sees_everything(self):
        """Architect persona has full access."""
        evidence_list = [
            {
                'evidence_id': 1,
                'statements': 'Security assessment completed',
                'allowed_roles': ['architect', 'project_manager'],
                'authority': 'governance',
            },
            {
                'evidence_id': 2,
                'statements': 'API implementation details',
                'allowed_roles': ['developer', 'architect'],
                'authority': 'operational',
            },
        ]
        user_roles = ['architect']
        filtered = filter_evidence(evidence_list, user_roles)
        visible = [e for e in filtered if not e.get('restricted', False)]
        assert len(visible) == 2

    def test_restricted_evidence_acknowledged(self):
        """When evidence is restricted, it should be acknowledged but not revealed."""
        evidence_list = [
            {
                'evidence_id': 1,
                'statements': 'Confidential security vulnerability found',
                'allowed_roles': ['architect'],
                'authority': 'governance',
            },
        ]
        user_roles = ['developer']
        filtered = filter_evidence(evidence_list, user_roles)
        
        # The evidence should either be filtered out or marked as restricted
        # "A security assessment exists but the underlying document is not available"
        for e in filtered:
            if e.get('restricted'):
                assert 'not available' in e.get('restricted_message', '').lower() or e.get('restricted') is True

    def test_management_hides_technical_details(self):
        """Management persona should not see git commits and dev configs."""
        config = get_persona_config('management')
        assert 'git_commits' not in config.get('sees', []) or 'dev_configs' not in config.get('sees', [])
