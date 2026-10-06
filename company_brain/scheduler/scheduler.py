import schedule
import time
import logging
from .sync import refresh_company_brain

logger = logging.getLogger(__name__)

def job():
    logger.info("Running scheduled refresh")
    refresh_company_brain(trigger_type="scheduled")

def start_scheduler():
    # Twice-daily cron (06:16 and 18:00)
    schedule.every().day.at("06:16").do(job)
    schedule.every().day.at("18:00").do(job)
    
    logger.info("Scheduler started")
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    start_scheduler()
