export class RecurringTask {
    // taskRunning = false // TODO: Write tests before introducing this feature
    aproximateNextRun: number | null = null
    private timeoutId: ReturnType<typeof setTimeout> | null = null

    constructor(
        private task: () => Promise<void>,
        private options: {
            intervalInMs: number
            onError: (error: Error) => void
            setTimeout?: (
                f: () => void,
                miliseconds: number,
            ) => ReturnType<typeof setTimeout>
        },
    ) {
        this.schedule()
    }

    stop() {
        this.clearTimeout()
        this.aproximateNextRun = null
    }

    async forceRun() {
        this.clearTimeout()
        try {
            await this.run()
        } catch (e) {
            this.options.onError(e)
            throw e
        } finally {
            this.schedule()
        }
    }

    private schedule() {
        const { intervalInMs } = this.options
        const now = Date.now()
        this.aproximateNextRun = now + intervalInMs
        this.timeoutId = (this.options.setTimeout || setTimeout)(async () => {
            try {
                await this.run()
            } catch (e) {
                this.options.onError(e)
            }
        }, intervalInMs)
    }

    private async run() {
        // this.taskRunning = true
        try {
            await this.task()
        } finally {
            // this.taskRunning = false
        }
    }

    private clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
    }
}
