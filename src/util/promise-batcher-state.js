import uniqWith from 'lodash/uniqWith'
import isEqual from 'lodash/isEqual'

class PromiseBatcherState {
    constructor(initData = []) {
        // State is of type: Array<{ input: any, status?: boolean, err?: string }>
        this.state = uniqWith(initData, isEqual).map(input => ({ input }))
    }

    _getInputStateIndex(input) {
        return this.state.findIndex(({ input: record }) => isEqual(input, record))
    }

    _record(input, record) {
        // Make sure input doesn't already exist in state
        const index = this._getInputStateIndex(input)
        if (index !== -1) {
            return false
        }

        // Mutate state
        this.state = [
            ...this.state,
            { input, ...record },
        ]

        return true
    }

    /**
     * @param {any} input The input to check against state.
     * @returns {boolean} Denotes whether or not the input exists in state.
     */
    has(input) {
        return this._getInputStateIndex(input) !== -1
    }

    /**
     * Resets the state to empty.
     */
    reset() {
        this.state = []
    }

    /**
     * @returns {Array<{ input: any, status?: boolean, err?: string }>} Array of input states.
     */
    getState() {
        return this.state
    }

    /**
     * @param {any} input The input to mark state as being processed successfully.
     * @returns {boolean} Denotes whether or not state was updated.
     */
    recordSuccess(input) {
        return this._record(input, { status: true })
    }

    /**
     * @param {any} input The input to mark state as being processed successfully.
     * @param {string} [err=''] The error message to set in state.
     * @returns {boolean} Denotes whether or not state was updated.
     */
    recordFailure(input, err = '') {
        return this._record(input, { status: false, err })
    }
}

export default PromiseBatcherState
