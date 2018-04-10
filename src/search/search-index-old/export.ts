import * as through2 from 'through2'

import db, { getAttachmentAsDataUrl } from '../../pouchdb'
import { ExportedPage } from '../migration'
import index from './index'

function exportPages({ chunkSize = 10 } = {}) {
    let lastKey = 'page/'
    let ended = false

    const consumeNext = () => {
        if (ended) {
            return Promise.resolve(null)
        }

        const data = []

        return new Promise((resolve, reject) => {
            ;(<any>index)
                .createKeyStream({
                    gt: lastKey,
                    lt: 'page/\uffff',
                    limit: chunkSize,
                    keyAsBuffer: false,
                })
                .pipe(
                    through2.obj(async function(key, enc, cb) {
                        lastKey = key

                        const pouchDoc = await db.get(key)(<any>index).get(
                            key,
                            { asBuffer: false },
                            async (err, indexDoc) => {
                                if (err) {
                                    // TODO: Design error handling
                                    return cb(err)
                                }

                                const getVisit = (visit: string) => ({
                                    timestamp: parseInt(
                                        visit.substr('visit/'.length),
                                    ),
                                })
                                const getBookmark = () =>
                                    parseInt(
                                        indexDoc.bookmarks
                                            .values()
                                            .next()
                                            .value.substr('bookmark/'.length),
                                    )
                                const screenshot = await getAttachmentAsDataUrl(
                                    {
                                        doc: pouchDoc,
                                        attachmentId: 'screenshot',
                                    },
                                )
                                const favIcon = await getAttachmentAsDataUrl({
                                    doc: pouchDoc,
                                    attachmentId: 'favicon',
                                })
                                const page: ExportedPage = {
                                    url: pouchDoc.url,
                                    content: {
                                        lang: pouchDoc.content.lang,
                                        title: pouchDoc.content.title,
                                        fullText: pouchDoc.content.fullText,
                                        keywords: pouchDoc.content.keywords,
                                        description:
                                            pouchDoc.content.description,
                                    },
                                    visits: Array.from(indexDoc.visits).map(
                                        getVisit,
                                    ),
                                    tags: Array.from(
                                        indexDoc.tags,
                                    ).map((tag: string) =>
                                        tag.substr('tag/'.length),
                                    ),
                                    bookmark: indexDoc.bookmarks.size
                                        ? getBookmark()
                                        : null,
                                    screenshot,
                                    favIcon,
                                }
                                this.push(page)

                                cb()
                            },
                        )
                    }),
                )
                .on('data', obj => {
                    data.push(obj)
                })
                .on('end', () => {
                    ended = data.length !== chunkSize
                    resolve(data)
                })
        })
    }

    return {
        next: consumeNext,
    }
}

export default exportPages
