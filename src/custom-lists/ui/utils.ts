/**
 * NOTE: This exists to stop click events bubbling up into web page handlers AND to stop page result <a> links
 *  from opening when you use the context menu in the dashboard.
 *  __If you add new click handlers to this component, ensure you wrap them with this!__
 */
export const __wrapClick = (
    handler: React.MouseEventHandler,
): React.MouseEventHandler => (e) => {
    e.preventDefault()
    e.stopPropagation()
    return handler(e)
}
