export default class ItemProcessor {
    finished = false
    cancelled = false

    static makeInterruptedErr() {
        const err = new Error('Execution interrupted')
        err.cancelled = true
        return err
    }

    process(item) {
        return Promise.resolve()
    }

    cancel() {
        this.cancelled = true
    }
}
