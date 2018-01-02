import Queue from 'queue'

/**
 * A "pretend priority queue" that allows items to be enqueued from the start of the queue.
 */
export default class extends Queue {
    /**
     * @param {any[]|any} jobs Single or array of jobs to push to the front of the queue.
     *  If multiple jobs, the priority will be given from lowest to max index.
     * @returns {number} The new length of the queue.
     */
    pushPriority(...jobs) {
        const res = this.jobs.unshift(...jobs)

        if (this.autostart) {
            this.start()
        }

        return res
    }

    /**
     * Removes all queued jobs.
     */
    clear() {
        this.jobs = []
    }
}
