import * as through2 from 'through2'
import db from '../../pouchdb'
import { ExportedPage } from '../import-export'
import index from './index'

export function exportPages() {
  return (<any>index)
    .createKeyStream({ limit: 10, keyAsBuffer: false })
    .pipe(through2.obj(async function (key, enc, cb) {
      console.log(key)
      const isPage = key.indexOf('/') === -1
      if (!isPage) {
        return cb()
      }

      index.get(key, { asBuffer: false }, async (err, val) => {
        if (err) {
          // TODO: Design error handling
          return cb()
        }

        const page: ExportedPage = {
          url: '',
          content: {
            title: '',
            fullText: ''
          },
          visits: [],
          tags: [],
          bookmark: null
        }
        this.push(page)

        cb()
      })
    }))
}
