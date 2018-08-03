// tslint:disable-next-line
export interface FieldConfig {}

export class Field {
    constructor(public config: FieldConfig = {}) {
        this.config = config
    }

    prepareForStorage(input) {
        return input
    }

    prepareFromStorage(stored) {
        return stored
    }
}
