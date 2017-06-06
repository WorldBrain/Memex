export default async function fixLinks({rootElement, docUrl}) {
    const head = rootElement.querySelector('head')
    if (head) {
        const base = head.ownerDocument.createElement('base')
        base.href = docUrl
        head.insertAdjacentElement('afterbegin', base)
    } else {
        const links = Array.from(rootElement.querySelectorAll('*[href]'))
        links.forEach(link => {
            const href = link.getAttribute('href')
            const absoluteUrl = new URL(href, docUrl)
            if (href !== absoluteUrl) {
                link.setAttribute('href', absoluteUrl)
            }
        })
        // TODO rewrite other attributes than href (see http://stackoverflow.com/a/2725168)
    }
}
