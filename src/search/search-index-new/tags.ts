import db from '.'
import normalizeUrl from '../../util/encode-url-for-id'
import analysePage from '../../page-analysis/background'
import fetchPageData from '../../page-analysis/background/fetch-page-data'
import pipeline from './pipeline'
import { Page } from './models'

interface Props {
    url: string
    tag: string
    tabId: number
}

const modifyTag = (shouldAdd: boolean) =>
    async function({ url, tag, tabId }: Props) {
        const normalized = normalizeUrl(url)

        let page = await db.pages.get(normalized)

        if (page == null) {
            if (tabId == null) {
                throw new Error(
                    `Page does not exist for URL and no tabID provided to extract content: ${normalized}`,
                )
            }

            const analysisRes = await analysePage({
                tabId,
                allowFavIcon: false,
            })

            const pageDoc = await pipeline({
                pageDoc: { ...analysisRes, url },
            })

            page = new Page(pageDoc)
        }

        return db.transaction('rw', db.tables, async () => {
            await page.loadRels()

            if (!page.visits.length) {
                page.addVisit() // Add new visit if none, else page won't appear in results
            }

            if (shouldAdd) {
                page.addTag(tag)
            } else {
                page.delTag(tag)
            }

            await page.save()
        })
    }

export const delTag = modifyTag(false)
export const addTag = modifyTag(true)
