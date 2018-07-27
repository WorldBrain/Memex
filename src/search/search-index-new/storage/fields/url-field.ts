import { Field } from './field'
import normalize from '../../../../util/encode-url-for-id'

export interface UrlFieldConfig {
    normalize?: boolean
}

export class UrlField extends Field {
    constructor(public config: UrlFieldConfig = {}) {
        super()

        this.config = config
        this.config.normalize =
            config.normalize == null ? true : config.normalize
    }

    prepareForStorage(input) {
        if (this.config.normalize) {
            input = normalize(input)
        }

        return input
    }
}
