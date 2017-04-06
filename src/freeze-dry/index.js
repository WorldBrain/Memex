import whenAllSettled from 'src/util/when-all-settled'
import inlineStyles from './inline-styles'
import removeScripts from './remove-scripts'
import inlineImages from './inline-images'

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
        removeScripts({rootElement}),
        inlineStyles({rootElement, docUrl}),
        inlineImages({rootElement, docUrl}),
    ]
    await whenAllSettled(jobs)

    // Read the resulting DOM as a string
    const html = rootElement.outerHTML
    return html
}
