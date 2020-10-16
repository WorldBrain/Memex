import { ActionPreprocessor } from '@worldbrain/memex-common/lib/action-queue/types'
import { ReadwiseAction } from './types/actions'
import cloneDeep from 'lodash/cloneDeep'

export const readwiseActionPreprocessor: ActionPreprocessor<ReadwiseAction> = ({
    action,
}) => {
    if (action.type !== 'post-highlights') {
        return { valid: true }
    }

    const processed = cloneDeep(action)
    for (const highlight of processed.highlights) {
        for (const [key, value] of Object.entries(highlight)) {
            if (typeof value === 'string') {
                highlight[key] = value.trim()
                if (!highlight[key].length) {
                    highlight[key] = null
                }
            }
        }

        if (highlight.text === undefined || highlight.text === null) {
            return {
                valid: false,
                validationError: `highlight in action '${action.type}' has missing 'text' field`,
            }
        }
    }

    return { valid: true, processed }
}
