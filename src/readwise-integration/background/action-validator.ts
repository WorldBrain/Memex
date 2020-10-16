import { ActionValidator } from '@worldbrain/memex-common/lib/action-queue/types'
import { ReadwiseAction } from './types/actions'

export const readwiseActionValidator: ActionValidator<ReadwiseAction> = ({
    action,
}) => {
    if (action.type !== 'post-highlights') {
        return { valid: true }
    }

    for (const highlight of action.highlights) {
        if (highlight.text === undefined || highlight.text === null) {
            return {
                valid: false,
                message: `highlight in action '${action.type}' has missing 'text' field`,
            }
        }
        for (const [key, value] of Object.entries(highlight)) {
            if (typeof value === 'string' && !value.length) {
                return {
                    valid: false,
                    message: `highlight in action '${action.type}' has empty '${key}' string field`,
                }
            }
        }
    }

    return { valid: true }
}
