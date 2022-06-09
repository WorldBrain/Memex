import {
    NON_UNIQ_LIST_NAME_ERR_MSG,
    BAD_CHAR_LIST_NAME_ERR_MSG,
    BAD_CHAR_LIST_PATTERN,
    EMPTY_LIST_NAME_ERR_MSG,
} from './constants'

type ListNameValidator = (
    name: string,
    otherLists: Array<{ id: number; name: string }>,
    args?: { listIdToSkip?: number },
) => { valid: true } | { valid: false; reason: string }

export const isListNameUnique: ListNameValidator = (
    name,
    otherLists,
    args = {},
) => ({
    reason: NON_UNIQ_LIST_NAME_ERR_MSG,
    valid: otherLists.reduce((acc, list) => {
        if (args?.listIdToSkip === list.id) {
            return acc
        }

        return acc && list.name !== name
    }, true),
})

export const validateListName: ListNameValidator = (
    name,
    otherLists,
    args = {},
) => {
    const trimmedName = name.trim()

    if (!trimmedName.length) {
        return { valid: false, reason: EMPTY_LIST_NAME_ERR_MSG }
    }
    if (BAD_CHAR_LIST_PATTERN.test(trimmedName)) {
        return { valid: false, reason: BAD_CHAR_LIST_NAME_ERR_MSG }
    }

    return isListNameUnique(trimmedName, otherLists, args)
}
