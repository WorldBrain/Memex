import { Field } from './field'

export class BoolField extends Field {
    prepareForStorage(input: boolean) {
        return input ? 1 : 0
    }

    prepareFromStorage(stored: 1 | 0) {
        return stored === 1 ? true : false
    }
}
