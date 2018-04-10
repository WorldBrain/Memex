import exportOldPages from '../search-index-old/export'
import importNewPage from '../search-index-new/import'

export default function migrate() {
    const exportChunk = exportOldPages({ chunkSize: 10 }).next

    // return new Promise((resolve, reject) => {
    //   exportOldPages()
    //     .on('data', (page: ExportedPage) => {
    //       importNewPage(page)
    //     })
    //     .on('error', reject)
    //     .on('end', resolve)
    // })
}

export * from './types'
