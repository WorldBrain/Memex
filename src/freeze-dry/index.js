import whenAllSettled from 'src/util/when-all-settled'
import inlineStyles from './inline-styles'
import removeScripts from './remove-scripts'
import inlineImages from './inline-images'
import setContentSecurityPolicy from './set-content-security-policy'
import fixLinks from './fix-links'

export default async function freezeDry (
    document = window.document,
    docUrl = document.URL,
) {
    // Clone the document's root element into a new (invisible) doc.
    let doc = document.implementation.createHTMLDocument()
    const rootElement = doc.importNode(
        document.documentElement,
        true /* deep copy */
    )
    doc.replaceChild(rootElement, doc.documentElement)

    const jobs = [
        // Removing scripts should be superfluous when setting the CSP; but it helps to protect
        // pre-CSP viewers, it saves space, and reduces error messages in the console.
        removeScripts({rootElement}),
        inlineStyles({rootElement, docUrl}),
        inlineImages({rootElement, docUrl}),
        fixLinks({rootElement, docUrl}),
        setContentSecurityPolicy({
            doc,
            policyDirectives: [
                "default-src 'none'", // Block any connectivity from media we did not deal with.
                "img-src data:", // Allow inlined images.
                "style-src data: 'unsafe-inline'", // Allow inlined styles.
                "font-src data:", // Allow inlined fonts.
            ],
        }),
    ]
    await whenAllSettled(jobs)

    // Read the resulting DOM as a string
    const html = rootElement.outerHTML
    return html
}
