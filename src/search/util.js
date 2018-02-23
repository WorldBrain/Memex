export const DEFAULT_TERM_SEPARATOR = /[|' .,\-|(\n)]+/
export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

export const removeKeyType = key =>
    key.replace(/^(term|title|visit|url|domain|tag|bookmark)\//, '')

// Key generation functions
export const keyGen = {
    domain: key => `domain/${key}`,
    tag: key => `tag/${key}`,
    url: key => `url/${key}`,
    term: key => `term/${key}`,
    title: key => `title/${key}`,
    visit: key => `visit/${key}`,
    bookmark: key => `bookmark/${key}`,
    _: key => key,
}

/**
 * Handles splitting up searchable content into indexable terms. Terms are all
 * lowercased.
 *
 * @param {string} content Searchable content text.
 * @param {string|RegExp} [separator=' '] Separator used to split content into terms.
 * @returns {string[]} Array of terms derived from `content`.
 */
export const extractContent = (
    content,
    { separator = DEFAULT_TERM_SEPARATOR, key = '_' },
) =>
    content
        .split(separator)
        .map(word => keyGen[key](word.toLowerCase()))
        .filter(term => !term.endsWith('/'))
