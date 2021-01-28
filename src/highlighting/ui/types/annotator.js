/**
 * Type definitions for objects passed between the annotator and sidebar.
 */

/**
 * Object representing a region of a document that an annotation
 * has been anchored to.
 *
 * This representation of anchor ranges allows for certain document mutations
 * in between anchoring an annotation and later making use of the anchored range,
 * such as inserting highlights for other anchors. Compared to the initial
 * anchoring of serialized selectors, resolving these ranges should be a
 * cheap operation.
 *
 * @typedef AbstractRange
 * @prop {() => Range} toRange -
 *   Resolve the abstract range to a concrete live `Range`. The implementation
 *   may or may not return the same `Range` each time.
 */

/**
 * @typedef {import("./api").Selector} Selector
 * @typedef {import("./api").Target} Target
 */

/**
 * An object representing an annotation in the document.
 *
 * @typedef AnnotationData
 * @prop {string} uri
 * @prop {Target[]} target
 * @prop {string} $tag
 * @prop {boolean} [$highlight] -
 *   Flag indicating that this annotation was created using the "Highlight" button,
 *   as opposed to "Annotate".
 * @prop {boolean} [$orphan] -
 *   Flag indicating that this annotation was not found in the document.
 *   It is initially `undefined` while anchoring is in progress and then set to
 *   `true` if anchoring failed or `false` if it succeeded.
 * @prop {DocumentMetadata} document
 */

/**
 * An object representing the location in a document that an annotation is
 * associated with.
 *
 * @typedef Anchor
 * @prop {AnnotationData} annotation
 * @prop {HTMLElement[]} [highlights] -
 *   The HTML elements that create the highlight for this annotation.
 * @prop {AbstractRange} [range] -
 *   Region of the document that this annotation's selectors were resolved to.
 * @prop {Target} target
 */

/**
 * Anchoring implementation for a particular document type (eg. PDF or HTML).
 *
 * This is responsible for converting between serialized "selectors" that can
 * be stored in the Hypothesis backend and ranges in the document.
 *
 * @typedef AnchoringImpl
 * @prop {(root: HTMLElement, selectors: Selector[], options: any) => Promise<Range>} anchor
 * @prop {(root: HTMLElement, range: Range, options: any) => Promise<Selector[]>} describe
 */

/**
 * Subset of the annotator `Guest` instance that is exposed to other modules
 *
 * @typedef Annotator
 * @prop {Anchor[]} anchors
 * @prop {(ann: AnnotationData) => Promise<Anchor[]>} anchor
 * @prop {AnchoringImpl} anchoring - Anchoring implementation for the current document type
 */

/**
 * @typedef DocumentMetadata
 * @prop {string} title
 * @prop {Object[]} link
 *   @prop {string} [link.rel]
 *   @prop {string} [link.type]
 *   @prop {string} link.href
 *
 * // HTML only.
 * @prop {Object.<string, string[]>} [dc]
 * @prop {Object.<string, string[]>} [eprints]
 * @prop {Object.<string, string[]>} [facebook]
 * @prop {Object.<string, string[]>} [highwire]
 * @prop {Object.<string, string[]>} [prism]
 * @prop {Object.<string, string[]>} [twitter]
 * @prop {string} [favicon]
 *
 * // HTML + PDF.
 * @prop {string} [documentFingerprint]
 */

/**
 * Global variables which the Hypothesis client looks for on the `window` object
 * when loaded in a frame that influence how it behaves.
 *
 * @typedef Globals
 * @prop {Object} [PDFViewerApplication] -
 *   PDF.js entry point. If set, triggers loading of PDF rather than HTML integration.
 * @prop {boolean} [__hypothesis_frame] -
 *   Flag used to indicate that the "annotator" part of Hypothesis is loaded in
 *   the current frame.
 */

/**
 * @typedef {Window & Globals} HypothesisWindow
 */

// Make TypeScript treat this file as a module.
export const unused = {}
