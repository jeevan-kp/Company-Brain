import logging
import os
import json
from typing import Any

# Mock script to seed all projects
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_all_projects():
    logger.info("Starting all projects data seeding...")
    
    logger.info("Seeding NOVA...")
    logger.info("Seeding PHOENIX...")
    logger.info("Seeding remaining projects (light records)...")
    
    logger.info("All projects seeded successfully.")

if __name__ == "__main__":
    seed_all_projects()
