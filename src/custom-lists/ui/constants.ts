export const NON_UNIQ_LIST_NAME_ERR_MSG = 'Space name already taken.'
export const EMPTY_LIST_NAME_ERR_MSG = 'Space name cannot be empty'
export const BAD_CHAR_LIST_NAME_ERR_MSG =
    'Space name cannot contain any of the characters: [] () {}'

/**
 * Used to test existence of any of the characters: [] () {}
 */
export const BAD_CHAR_LIST_PATTERN = /(\[|\]|\(|\)|\{|\})/
