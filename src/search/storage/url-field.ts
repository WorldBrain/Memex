import { Field } from '@worldbrain/storex/lib/fields/types'
import { PrimitiveFieldType } from '@worldbrain/storex/lib/types'

import normalize from 'src/util/encode-url-for-id'
import { POST_URL_ID_MATCH_PATTERN } from 'src/social-integration/constants'

export default class UrlField extends Field {
    primitiveType = 'string' as PrimitiveFieldType

    async prepareForStorage(input) {
        if (!input || POST_URL_ID_MATCH_PATTERN.test(input)) {
            return input
        }

        return normalize(input)
    }
}
