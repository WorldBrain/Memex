import db, { Page, FavIcon } from '.'
import { ExportedPage } from '../migration'

async function importPage({
    bookmark,
    visits,
    tags,
    favIconURI,
    ...pageData
}: ExportedPage) {
    return db.transaction('rw', db.tables, async () => {
        const page = new Page(pageData)

        if (favIconURI != null) {
            await new FavIcon({ hostname: page.hostname, favIconURI })
                .save()
                .catch()
        }

        if (bookmark != null) {
            page.setBookmark(bookmark)
        }

        visits.forEach(({ time, ...data }) => page.addVisit(time, data))
        tags.forEach(tag => page.addTag(tag))

        await page.save()
    })
}

export default importPage
