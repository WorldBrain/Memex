import { exportPages as exportOldPages } from './search-index-old/export'
import { importPage as importNewPage } from './search-index-new/import'
import { ExportedPage } from './import-export';

export default function migrate() {
  const exportChunk = exportOldPages({ chunkSize: 10 }).next

  return new Promise((resolve, reject) => {
    exportOldPages()
      .on('data', (page: ExportedPage) => {
        importNewPage(page)
      })
      .on('error', reject)
      .on('end', resolve)
  })
}
