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
