import { blobToArrayBuffer } from 'blob-util'

import db from 'src/pouchdb'


async function showPage(pageId) {
    // Read the html file from the database.
    const blob = await db.getAttachment(pageId, 'frozen-page.html')

    // Replace the document contents.
    try {
        // We assume utf-8 encoding. TODO: read encoding from document.
        const html = new TextDecoder('utf-8').decode(await blobToArrayBuffer(blob))
        // Strip the <html>...</html> tags because we set innerHTML.
        const innerHTML = html.match(/[^]*?<html[^]*?>([^]*)<\/html[^]*?>/i)[1]
        document.documentElement.innerHTML = innerHTML

        // Pragmatic workaround for Chromium, which appears to inject values for
        // these two properties (with font-family: 75%, for some reason?)
        if (document.head !== undefined) {
            const styleEl = document.createElement('style')
            styleEl.innerHTML = `body {
                font-size: inherit;
                font-family: inherit;
            }`
            document.head.insertAdjacentElement('afterbegin', styleEl)
        }
    } catch (err) {
        // Alternatively, use a blob URL (downside: the url is very temporary).
        const blobUrl = URL.createObjectURL(blob)
        window.location = blobUrl
    }
}

const pageId = new URL(window.location).searchParams.get('page')
showPage(pageId)
