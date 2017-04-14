import { blobToBinaryString } from 'blob-util'

import db from 'src/pouchdb'


async function showPage(pageId) {
    console.log(`Loading page '${pageId}' from database..`)
    const blob = await db.getAttachment(pageId, 'frozen-page.html')
    console.log('Got page blob.')

    const htmlString = await blobToBinaryString(blob)

    // Replace the document contents.
    try {
        document.open()
        document.write(htmlString)
        document.close()
    } catch (err) {
        // Just in case document.write fails, e.g. due to browser quirks.
        // Use a blob URL (downside: the url is very temporary).
        const blobUrl = URL.createObjectURL(blob)
        window.location = blobUrl
    }
}

const pageId = new URL(window.location).searchParams.get('page')
showPage(pageId)
