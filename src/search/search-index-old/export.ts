import * as through2 from 'through2'
import db from '../../pouchdb'
import { ExportedPage } from '../import-export'
import index from './index'

export function exportPages() {
  return (<any>index)
    .createKeyStream({
      gt: 'page/',
      lt: 'page/\uffff',
      limit: 10,
      keyAsBuffer: false
    })
    .pipe(through2.obj(async function (key, enc, cb) {
      const pouchDoc = await db.get(key)

      index.get(key, { asBuffer: false }, async (err, indexDoc) => {
        if (err) {
          // TODO: Design error handling
          return cb()
        }

        const getVisit = (visit: string) => ({
          timestamp: parseInt(visit.substr('visit/'.length))
        })
        const getBookmark = () => parseInt(indexDoc.bookmarks.values().next().value.substr('bookmark/'.length))
        const page: ExportedPage = {
          url: pouchDoc.url,
          content: {
            lang: pouchDoc.content.lang,
            title: pouchDoc.content.title,
            fullText: pouchDoc.content.fullText,
            keywords: pouchDoc.content.keywords,
            description: pouchDoc.content.description
          },
          visits: Array.from(indexDoc.visits).map(getVisit),
          tags: Array.from(indexDoc.tags).map((tag: string) => tag.substr('tag/'.length)),
          bookmark: indexDoc.bookmarks.size ? getBookmark() : null
        }
        this.push(page)

        cb()
      })
    }))
}
