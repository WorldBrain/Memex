import { blobToArrayBuffer } from 'blob-util'

import db from 'src/pouchdb'


function fixChromiumInjectedStylesheet(document) {
    // Pragmatic workaround for Chromium, which appears to inject two style
    // rules into extension pages (with font-size: 75%, for some reason?).
    const styleEl = document.createElement('style')
    styleEl.innerHTML = `body {
        font-size: inherit;
        font-family: inherit;
    }`
    document.head.insertAdjacentElement('afterbegin', styleEl)
}

async function showPage(pageId) {
    // Read the html file from the database.
    const blob = await db.getAttachment(pageId, 'frozen-page.html')
    // We assume utf-8 encoding. TODO: read encoding from document.
    const html = new TextDecoder('utf-8').decode(await blobToArrayBuffer(blob))

    // Show the page in the iframe.
    const iframe = document.getElementById('page')
    iframe.srcdoc = html
    // XXX The DOMContentLoaded event would be better, but how to listen to that?
    iframe.onload = () => {
        const doc = iframe.contentDocument

        // Ensure a head element exists.
        if (!doc.head) {
            const head = doc.createElement('head')
            doc.documentElement.insertAdjacentElement('afterbegin', head)
        }

        // Make links open in the whole tab, not inside the iframe
        const baseEl = doc.createElement('base')
        baseEl.setAttribute('target', '_parent')
        doc.head.insertAdjacentElement('afterbegin', baseEl)

        // Workaround required for Chromium.
        fixChromiumInjectedStylesheet(doc)

        // Focus on the page so it receives e.g. keyboard input
        iframe.contentWindow.focus()
    }
}

// Read pageId from location: ?page=pageId
const pageId = new URL(window.location).searchParams.get('page')
showPage(pageId)
