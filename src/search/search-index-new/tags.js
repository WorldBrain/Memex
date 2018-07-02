import db from '.'
import normalizeUrl from 'src/util/encode-url-for-id'

const modifyTag = shouldAdd =>
    function(url, tag) {
        const normalized = normalizeUrl(url)

        return db.transaction('rw', db.tables, async () => {
            const page = await db.pages.get(normalized)

            if (page == null) {
                throw new Error(
                    'Page does not exist for provided URL:',
                    normalized,
                )
            }

            await page.loadRels()

            if (shouldAdd) {
                page.addTag(tag)
            } else {
                page.delTag(tag)
            }

            return await page.save()
        })
    }

export const delTag = modifyTag(false)
export const addTag = modifyTag(true)

const modifyAnnotationTag = shouldAdd => (url, tag) => {
    return db.transaction('rw', db.tables, async () => {
        window.dl = db.directLinks
        const annotation = await db.directLinks.get(url)

        if (annotation == null) {
            throw new Error('Annotation does not exist for provided URL:', url)
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

window.getATags = getAnnotationTags
