export class SearchError extends Error {
    constructor(msg?: string) {
        super(msg)
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export class BadTermError extends SearchError {}
export class InvalidSearchError extends SearchError {}
