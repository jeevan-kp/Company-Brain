def normalize_action_item(raw_action: dict) -> dict:
    """Normalize action items from various sources (Teams, Jira, etc.)"""
    return {
        "id": raw_action.get("id"),
        "title": raw_action.get("title", ""),
        "owner": raw_action.get("owner", ""),
        "due_date": raw_action.get("due_date", ""),
        "status": raw_action.get("status", "open"),
        "source": raw_action.get("source", "unknown")
    }
