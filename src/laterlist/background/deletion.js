import { fetchDocTypesByUrl } from 'src/pouchdb'
import { generatePageDocId } from 'src/page-storage'
import * as index from 'src/search'
import deleteDocsByUrl, { deleteDocs } from 'src/page-storage/deletion'
import { laterlistKeyPrefix } from '..'

async function removeLaterlistByUrl(url) {
    const pageId = generatePageDocId({ url })
    const reverseIndexDoc = await index.initSingleLookup()(pageId)

    if (reverseIndexDoc == null) {
        throw new Error(
            `No document exists in reverse page index for the supplied page ID: ${pageId}`,
        )
    }

    if (!reverseIndexDoc.visits.size) {
        await deleteDocsByUrl(url)
    } else {
        await index.del([...reverseIndexDoc.laterlist.values()])

        reverseIndexDoc.laterlist.clear()
        await index.put(pageId, reverseIndexDoc)
    }

    const fetchDocsByType = fetchDocTypesByUrl(url)
    const { rows: laterlistRows } = await fetchDocsByType(laterlistKeyPrefix)
    await deleteDocs(laterlistRows)
}

export default removeLaterlistByUrl
