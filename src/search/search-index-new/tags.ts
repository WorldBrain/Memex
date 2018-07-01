import db from '.'
import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'

interface Props {
    url: string
    tag: string
    tabId?: number
}

const modifyTag = (shouldAdd: boolean) =>
    async function({ url, tag, tabId }: Props) {
        let page = await getPage(url)

        if (page == null || page.isStub) {
            page = await createPageViaBmTagActs({ url, tabId })
        }

        // Add new visit if none, else page won't appear in results
        if (!page.visits.length) {
            page.addVisit()
        }

        if (shouldAdd) {
            page.addTag(tag)
        } else {
            page.delTag(tag)
        }

        await page.save()
    }

export const delTag = modifyTag(false)
export const addTag = modifyTag(true)

const modifyAnnotationTag = (shouldAdd: boolean) => (
    url: string,
    tag: string,
) => {
    return db.transaction('rw', db.tables, async () => {
        const annotation = await db.directLinks.get(url)

        if (annotation == null) {
            throw new Error(
                'Annotation does not exist for provided URL: ' + url,
            )
        }

        if (shouldAdd) {
            db.tags.add({
                name: tag,
                url: url,
            })
        } else {
            db.tags.remove({
                name: tag,
                url: url,
            })
        }
    })
}

export const addAnnotationTag = modifyAnnotationTag(true)
export const delAnnotationTag = modifyAnnotationTag(false)

export const getAnnotationTags = async url => {
    return await db.tags.where({ url: url }).toArray()
}
