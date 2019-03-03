/**
 * Pattern to match entire string to match `domain.tld`-like format + optional subdomain
 * prefix, ccTLD postfix, `site:` prefix, and excluded `-` prefix.
 */
export const DOMAIN_TLD_PATTERN = /^-?(site:)?(\w+\.)?[\w-]{2,}\.\w{2,3}(\.\w{2})?$/

/**
 * Pattern to match against individual terms to determine whether or not they are excluded
 * (prefixed with hyphen: -). Also supports site exclusion, which may be prefixed with
 * `site:` syntax.
 */
export const EXCLUDE_PATTERN = /^-(site:)?(?=\w+)/

/**
 * Pattern used to remove excluded syntax, and leading "site:" syntax from a term.
 * This is used after the type of term is determined (excluded, site/normal term, etc.).
 */
export const TERM_CLEAN_PATTERN = /^-?(site:)?-?(?=\w+)/

/**
 * Pattern to match hashtag prefix syntax for tags.
 */
export const HASH_TAG_PATTERN = /^-?#\w[\w+]*$/

export const DATE_PICKER_DATE_FORMAT = 'DD-MM-YYYY'

export const PAGE_SIZE = 10
