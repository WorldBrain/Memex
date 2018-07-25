import { BoolField } from './bool-field'
import { UrlField } from './url-field'

import { Field } from './field'

const FIELD_TYPES: { [key: string]: typeof Field } = {
    url: UrlField,
    bool: BoolField,
}

export { Field }
export default FIELD_TYPES
