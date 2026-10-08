// ============================================================================
// agent/semaphore.js — DB Connection Pool Protection & Concurrency Limiter
// ============================================================================

class Semaphore {
    constructor(maxConcurrent = 2) {
        this.maxConcurrent = maxConcurrent;
        this.currentRunning = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.currentRunning < this.maxConcurrent) {
            this.currentRunning++;
            return;
        }

        return new Promise(resolve => {
            this.queue.push(resolve);
        });
    }

    release() {
        this.currentRunning--;
        if (this.queue.length > 0) {
            this.currentRunning++;
            const next = this.queue.shift();
            next();
        }
    }

    async run(fn) {
        await this.acquire();
        try {
            return await fn();
        } finally {
            this.release();
        }
    }
}

const dbSemaphore = new Semaphore(2);

module.exports = {
    Semaphore,
    dbSemaphore
};
