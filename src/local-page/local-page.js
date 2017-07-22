import { blobToArrayBuffer } from 'blob-util'

import db from 'src/pouchdb'
import { getPage } from 'src/search/find-pages'
import { getTimestamp } from 'src/activity-logger'
import shortUrl from 'src/util/short-url'
import niceTime from 'src/util/nice-time'
import syncLocationHashes from 'src/util/sync-location-hashes'


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
    const page = await getPage({pageId, followRedirects: true})
    if (page._id !== pageId) {
        // Apparently getPage followed one or more redirects. Reload the viewer
        // with the resolved page's id in the ?page query.
        const location = new URL(window.location)
        location.searchParams.set('page', page._id)
        window.location = location
    }
    const timestamp = getTimestamp(page)

    // Read the html file from the database.
    const blob = await db.getAttachment(pageId, 'frozen-page.html')
    // We assume utf-8 encoding. TODO: read encoding from document.
    const html = new TextDecoder('utf-8').decode(await blobToArrayBuffer(blob))

    // Add content to the header bar.
    document.title = `📄 ${page.title}`
    const bar = document.getElementById('bar')
    const barContent = `
        <span id="description">
            <i class="camera icon"></i>
            Snapshot of <a href="${page.url}" style="margin: 0 4px;">${shortUrl(page.url)}</a>
            <i class="clock icon"></i>
            <time datetime="${new Date(timestamp)}">
                ${niceTime(timestamp)}
            </time>
        </span>
        <button
            id="downloadButton"
            class="ui compact tiny icon button"
        >
            <i class="download icon"></i>
            Save page as…
        </button>
    `
    bar.innerHTML = barContent

    const downloadButton = document.getElementById('downloadButton')
    downloadButton.onclick = async () => {
        // Reread the html file from the database. XXX This might not be the version that is shown.
        const blob = await db.getAttachment(pageId, 'frozen-page.html')
        const url = URL.createObjectURL(blob)
        // Use title as filename, after removing (back)slashes.
        let filename = `${page.title.replace(/[\\/]/g, '-')}.html`
        try {
            await browser.downloads.download({url, filename, saveAs: true})
        } catch (err) {
            // Possibly due to punctuation in the filename (Chromium is picky).
            if (err.message.includes('filename')) {
                filename = filename.replace(/["?:~<>*|]/g, '-') // an emperically composed list.
                await browser.downloads.download({url, filename, saveAs: true})
            }
        }
        // Forget the blob again. Firefox needs a moment; we give it 10s to be on the safe side.
        window.setTimeout(() => URL.revokeObjectURL(url), 1000*10)
    }

    // Show the page in the iframe.
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-same-origin allow-top-navigation allow-scripts')
    iframe.setAttribute('id', 'page')
    iframe.setAttribute('seamless', 'seamless')
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

        // Keep the iframe's location #hash in sync with that of the window.
        syncLocationHashes([window, iframe.contentWindow], {initial: window})
    }
    document.body.appendChild(iframe)
}

// Read pageId from location: ?page=pageId
const pageId = new URL(window.location).searchParams.get('page')
showPage(pageId)
