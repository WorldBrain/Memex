import Readability from 'readability'

// Extract the 'main text' from a web page (esp. news article, blog post, ...).
function extractPageText_sync({
    // By default, use the globals window and document.
    loc = window.location,
    doc = document,
}={}) {
    const uri = {
        spec: loc.href,
        host: loc.host,
        prePath: loc.protocol + "//" + loc.host,
        scheme: loc.protocol.substr(0, loc.protocol.indexOf(":")),
        pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1)
    }
    let article
    try {
        article = new Readability(
            uri,
            // Readability mutates the DOM, so pass it a clone.
            doc.cloneNode(true),
        ).parse()
    }
    catch (err) {
        // Bummer.
        console.error('Readability (content extraction) crashed:', err)
    }
    return {
        ...article,
        // Also return full text, as article may be empty or wrong.
        bodyInnerText: doc.body.innerText,
    }
}

// Wrap it in a promise.
export default function extractPageText_async(...args) {
    return new Promise(function (resolve, reject) {
        const run = () => resolve(extractPageText_sync(...args))
        window.setTimeout(run, 0)
    })
}
