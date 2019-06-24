export class StorexError extends Error {
    constructor(msg: string) {
        super(msg)
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export class UnimplementedError extends StorexError {}
export class InvalidFindOptsError extends StorexError {}
