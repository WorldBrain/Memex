export type FetchPageDataErrorType = 'permanent' | 'temporary'

export class FetchPageDataError extends Error {
    constructor(msg: string, private type: FetchPageDataErrorType) {
        super(msg)
        Object.setPrototypeOf(this, new.target.prototype)
    }

    get isTempFailure(): boolean {
        return this.type === 'temporary'
    }
}
