import hashlib
import logging

logger = logging.getLogger(__name__)

def compute_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()

def fetch_changes(since_watermark: str):
    return []

def refresh_company_brain(trigger_type: str = "manual"):
    logger.info(f"Starting refresh_company_brain with trigger_type: {trigger_type}")
    
    # 1. For each enabled adapter: fetch_changes
    changes = fetch_changes("last_watermark")
    
    # 2. Normalize and compute hash
    for change in changes:
        content_hash = compute_hash(str(change))
        # 3. Hash-based diff: insert/update/skip
        # 4. Extract semantics
        # 5. Create entities/relationships/evidence
    
    # 6. Recalculate readiness for affected projects
    logger.info("Refresh complete")
