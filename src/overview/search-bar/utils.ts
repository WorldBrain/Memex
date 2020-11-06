import { SEARCH_INPUT_SPLIT_PATTERN, TAG_CLEAN_PATTERN } from './constants'

export const stripTagPattern = (tag: string): string => {
    if (!tag.length) {
        return tag
    }

    if (tag[0] === '-') {
        tag = tag.slice(1)
    }

    return tag.replace(TAG_CLEAN_PATTERN, '').split('+').join(' ')
}

export const splitInputIntoTerms = (input: string): string[] =>
    input.toLowerCase().match(SEARCH_INPUT_SPLIT_PATTERN) || []
