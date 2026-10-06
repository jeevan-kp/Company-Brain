import logging

# Mock script to reset demo
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_demo():
    logger.info("Truncating all tables...")
    logger.info("Reloading all seed data...")
    logger.info("Recalculating all readiness and conflicts...")
    logger.info("Verifying all expected Q&A pairs work...")
    logger.info("Demo reset successfully in < 30 seconds.")

if __name__ == "__main__":
    reset_demo()
