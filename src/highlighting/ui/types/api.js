/**
 * Type definitions for objects returned from the Hypothesis API.
 *
 * The canonical reference is the API documentation at
 * https://h.readthedocs.io/en/latest/api-reference/
 */

/**
 * @typedef TextQuoteSelector
 * @prop {'TextQuoteSelector'} type
 * @prop {string} exact
 * @prop {string} [prefix]
 * @prop {string} [suffix]
 */

/**
 * @typedef TextPositionSelector
 * @prop {'TextPositionSelector'} type
 * @prop {number} start
 * @prop {number} end
 */

/**
 * @typedef RangeSelector
 * @prop {'RangeSelector'} type
 * @prop {string} startContainer
 * @prop {string} endContainer
 * @prop {number} startOffset
 * @prop {number} endOffset
 */

/**
 * @typedef {TextQuoteSelector | TextPositionSelector | RangeSelector} Selector
 */

/**
 * @typedef Target
 * @prop {string} source
 * @prop {Selector[]} [selector]
 *

/**
 * TODO - Fill out remaining properties
 *
 * @typedef Annotation
 * @prop {string} [id] -
 *   The server-assigned ID for the annotation. This is only set once the
 *   annotation has been saved to the backend.
 * @prop {string} $tag - A locally-generated unique identifier for annotations.
 *   This is set for all annotations, whether they have been saved to the backend
 *   or not.
 * @prop {string[]} [references]
 * @prop {string} created
 * @prop {boolean} [flagged]
 * @prop {string} group
 * @prop {string} updated
 * @prop {string[]} tags
 * @prop {string} text
 * @prop {string} uri
 * @prop {string} user
 * @prop {boolean} hidden
 *
 * @prop {Object} document
 *   @prop {string} document.title
 *
 * @prop {Object} permissions
 *   @prop {string[]} permissions.read
 *   @prop {string[]} permissions.update
 *   @prop {string[]} permissions.delete
 *
 * @prop {Target[]} target
 *
 * @prop {Object} [moderation]
 *   @prop {number} moderation.flagCount
 *
 * @prop {Object} links
 *   @prop {string} [links.incontext] - A "bouncer" URL to the annotation in
 *     context on its target document
 *   @prop {string} [links.html] - An `h`-website URL to view the annotation
 *     by itself
 *
 * @prop {Object} [user_info]
 *   @prop {string|null} user_info.display_name
 *
 * // Properties not present on API objects, but added by utilities in the client.
 * @prop {boolean} [$highlight]
 * @prop {boolean} [$orphan]
 * @prop {boolean} [$anchorTimeout]
 */

/**
 * @typedef Profile
 * @prop {string|null} userid
 * @prop {Object} preferences
 *   @prop {boolean} [preferences.show_sidebar_tutorial]
 * @prop {Object.<string, boolean>} features
 * @prop {Object} [user_info]
 *   @prop {string|null} user_info.display_name
 *
 * @prop {unknown} [groups] - Deprecated.
 */

/**
 * TODO - Fill out remaining properties
 *
 * @typedef Organization
 * @prop {string} name
 * @prop {string} logo
 * @prop {string} id
 * @prop {boolean} [default]
 */

/**
 * @typedef GroupScopes
 * @prop {boolean} enforced
 * @prop {string[]} uri_patterns;
 */

/**
 * TODO - Fill out remaining properties
 *
 * @typedef Group
 * @prop {string} id
 * @prop {'private'|'open'} type
 * @prop {Organization} organization - nb. This field is nullable in the API, but
 *   we assign a default organization on the client.
 * @prop {GroupScopes|null} scopes
 * @prop {Object} links
 *   @prop {string} [links.html]
 *
 * // Properties not present on API objects, but added by utilities in the client.
 * @prop {string} logo
 * @prop {boolean} isMember
 * @prop {boolean} isScopedToUri
 * @prop {string} name
 * @prop {boolean} canLeave
 */

// Make TypeScript treat this file as a module.
export const unused = {}
