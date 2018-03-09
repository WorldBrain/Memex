import db, { addPage, addTag } from './index'
import { ExportedPage } from '../import-export'

export async function importPage(page: ExportedPage) {
  await addPage({
    pageDoc: {
      content: page.content,
      url: page.url,
    },
    visits: page.visits,
    bookmark: page.bookmark,
    // screenshotURI: page.screenshot,
    // favIconURI: page.favIcon,
  })
  for (const tag of page.tags) {
    await addTag(page.url, tag)
  }
}
