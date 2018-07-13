export class StorageManagerError extends Error {
    constructor(msg: string) {
        super(msg)
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export class UnimplementedError extends StorageManagerError {}
export class InvalidFindOptsError extends StorageManagerError {}
