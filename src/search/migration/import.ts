import { Page, FavIcon } from '..'
import { ExportedPage } from './types'
import { Dexie } from '../types'

const importPage = (getDb: Promise<Dexie>) => async ({
    bookmark,
    visits,
    tags,
    favIconURI,
    ...pageData
}: ExportedPage) => {
    const db = await getDb
    return db.transaction('rw', db.tables, async () => {
        const page = new Page(pageData)

        if (favIconURI != null) {
            await new FavIcon({ hostname: page.hostname, favIconURI })
                .save(getDb)
                .catch()
        }

        if (bookmark != null) {
            page.setBookmark(bookmark)
        }

        visits.forEach(({ time, ...data }) => page.addVisit(time, data))
        tags.forEach(tag => page.addTag(tag))

        await page.save(getDb)
    })
}

export default importPage
