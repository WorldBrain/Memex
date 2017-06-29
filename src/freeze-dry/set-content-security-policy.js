// Puts the given CSP directives into a <meta> tag of the given document.
export default function setContentSecurityPolicy({doc, policyDirectives}) {
    // Ensure a head element exists.
    if (!doc.head) {
        const head = doc.createElement('head')
        doc.documentElement.insertAdjacentElement('afterbegin', head)
    }

    // Disallow any sources, except data URIs where we use them.
    const csp = policyDirectives.join('; ')

    const metaEl = doc.createElement('meta')
    metaEl.setAttribute('http-equiv', 'Content-Security-Policy')
    metaEl.setAttribute('content', csp)
    doc.head.insertAdjacentElement('afterbegin', metaEl)
}
