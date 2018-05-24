import normalize from '../../../util/encode-url-for-id'

export class Field {
    prepareForStorage(input) {
        return input
    }

    prepareFromStorage(stored) {
        return stored
    }
}

export interface UrlFieldConfig {
    normalize?: string
}

export class UrlField extends Field {
    constructor(public config: UrlFieldConfig = {}) {
        super()

        this.config = config
        this.config.normalize = _default(config.normalize, true)
    }

    prepareForStorage(input) {
        if (this.config.normalize) {
            input = normalize(input)
        }

        return input
    }
}

function _default(option, def) {
    if (typeof option === 'undefined') {
        return def
    }
}

export default {
    url: UrlField
}
