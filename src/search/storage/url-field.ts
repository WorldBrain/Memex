import normalize from '../../util/encode-url-for-id'

// TODO: extend from `Field` type once we work out storex exports
export default class UrlField {
    primitiveType = 'string'

    prepareForStorage(input) {
        return normalize(input)
    }

    prepareFromStorage(stored) {
        return stored
    }
}
