export default class Interruptable {
    cancelled: boolean = false
    paused: boolean = false
    private pausePromise?: Promise<null> // only set if paused, resolved when pause ends
    private resolvePausePromise?: () => void // only set if paused

    async cancel() {
        this.cancelled = true
    }

    async pause() {
        if (this.paused || this.cancelled) {
            return
        }

        this.paused = true
        this.pausePromise = new Promise(resolve => {
            this.resolvePausePromise = resolve
        })
    }

    async resume() {
        this.paused = false
        this.pausePromise = null
        this.resolvePausePromise()
        this.resolvePausePromise = null
    }

    async whileLoop(condition, body) {
        if (!this.cancelled) {
            while (await condition()) {
                if (await this._shouldCancelAfterWaitingForPause()) {
                    break
                }

                await body()
            }
        }
    }

    async forOfLoop(collection, body) {
        for (const item of collection) {
            if (await this._shouldCancelAfterWaitingForPause()) {
                break
            }

            await body(item)
        }
    }

    async execute(f) {
        if (await this._shouldCancelAfterWaitingForPause()) {
            return
        }

        return f()
    }

    async _shouldCancelAfterWaitingForPause() {
        if (this.paused) {
            await this.pausePromise
        }
        return this.cancelled
    }
}
