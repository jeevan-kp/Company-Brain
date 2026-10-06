def normalize_meeting_record(raw_meeting: dict) -> dict:
    """Normalize meeting records"""
    return {
        "id": raw_meeting.get("meeting_id"),
        "title": raw_meeting.get("title", "Untitled Meeting"),
        "datetime": raw_meeting.get("datetime"),
        "participants": raw_meeting.get("participants", []),
        "decisions": raw_meeting.get("decisions", []),
        "action_items": raw_meeting.get("action_items", []),
        "transcript_excerpt": raw_meeting.get("transcript_excerpt", "")
    }
