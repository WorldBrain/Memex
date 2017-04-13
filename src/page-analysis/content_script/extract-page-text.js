import Readability from 'readability'

function extractPageText(doc, loc) {
    const uri = {
        spec: loc.href,
        host: loc.host,
        prePath: loc.protocol + '//' + loc.host,
        scheme: loc.protocol.substr(0, loc.protocol.indexOf(':')),
        pathBase: loc.protocol + '//' + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf('/') + 1),
    }
    let article
    try {
        article = new Readability(
            uri,
            // Readability mutates the DOM, so pass it a clone.
            doc.cloneNode(true)
        ).parse()
    } catch (err) {
        // Bummer.
        console.error('Readability (content extraction) crashed:', err)
    }

    return {
        ...article,
        // Also return full text, as article may be empty or wrong.
        bodyInnerText: doc.body.innerText,
    }
}

// Wrap it in a promise to defer execution.
export default function extractPageTextAsync(...args) {
    return new Promise(function (resolve, reject) {
        const run = () => resolve(extractPageText(...args))
        window.setTimeout(run, 0)
    })
}
