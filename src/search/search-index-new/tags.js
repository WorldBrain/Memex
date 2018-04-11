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
