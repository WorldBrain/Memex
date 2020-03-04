/**
 * Injects a CSS stylesheet into the webpage.
 * @param {string} cssUrl URL of the stylesheet to inject
 */
export function injectCSS(cssUrl: string, root: Element = null) {
    // Check if the css file is already present in the webpage
    const node = (root || document).querySelector(`link[href="${cssUrl}"]`)
    if (node) {
        return
    }
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = cssUrl
    const d = root || document.body || document.head || document.documentElement
    d.prepend(link)
}

export function injectScript(
    src: string,
    options?: { parent?: Element; id?: string },
) {
    const script = document.createElement('script')
    script.src = src
    if (options.id) {
        script.id = options.id
    }
    ;(options?.parent || document.body).appendChild(script)
}
