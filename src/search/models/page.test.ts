import expect from 'expect'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import initStorageManager from 'src/search/memory-storex'
import BookmarksBackground from 'src/bookmarks/background'
import Page, { PageConstructorOptions } from './page'
import Visit from './visit'
import * as DATA from './page.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

async function setupTest() {
    const setup = await setupBackgroundIntegrationTest()

    return { storageManager: setup.storageManager }
}

function compareDBPageWithPageData(
    dbPage: Page,
    pageData: PageConstructorOptions,
) {
    expect(dbPage.url).toEqual(pageData.url)
    expect(dbPage.fullUrl).toEqual(pageData.fullUrl)
    expect(dbPage.fullTitle).toEqual(pageData.fullTitle)
    expect(dbPage.domain).toEqual(pageData.domain)
    expect(dbPage.hostname).toEqual(pageData.hostname)
    expect(dbPage.text).toEqual(pageData.text)
    expect(dbPage.terms).toEqual(expect.arrayContaining(pageData.terms))
    expect(dbPage.urlTerms).toEqual(expect.arrayContaining(pageData.urlTerms))
    expect(dbPage.titleTerms).toEqual(
        expect.arrayContaining(pageData.titleTerms),
    )
}

describe('Page model tests', () => {
    it('should be able to save a new page', async () => {
        const { storageManager } = await setupTest()

        const page = new Page(storageManager, DATA.testPageA)
        await page.save()

        const foundPage = await storageManager
            .collection('pages')
            .findObject<Page>({ url: DATA.testPageA.url })

        compareDBPageWithPageData(foundPage, DATA.testPageA)
    })

    it('should be able to save a new page with visits', async () => {
        const { storageManager } = await setupTest()
        const visitsData = [DATA.visitTimeA, DATA.visitTimeB, DATA.visitTimeC]

        const page = new Page(storageManager, DATA.testPageA)
        visitsData.forEach(v => page.addVisit(v))
        await page.save()

        const foundPage = await storageManager
            .collection('pages')
            .findObject<Page>({ url: DATA.testPageA.url })

        compareDBPageWithPageData(foundPage, DATA.testPageA)

        const foundVisits = await storageManager
            .collection('visits')
            .findObjects<Visit>({ url: DATA.testPageA.url })

        const foundVisitTimes = foundVisits.map(v => v.time)
        expect(foundVisitTimes).toEqual(expect.arrayContaining(visitsData))
    })

    it('should be able to update/save an existing page', async () => {
        const { storageManager } = await setupTest()

        const updatedTitle =
            'Changing the title to something completely different'
        const updatedTitleTerms = [
            'changing',
            'title',
            'something',
            'completely',
            'different',
        ]

        const page = new Page(storageManager, DATA.testPageA)
        await page.save()

        const foundPagePreUpdate = await storageManager
            .collection('pages')
            .findObject<Page>({ url: DATA.testPageA.url })

        compareDBPageWithPageData(foundPagePreUpdate, DATA.testPageA)

        // Update the title and re-save
        page.fullTitle = updatedTitle
        page.titleTerms = updatedTitleTerms
        await page.save()

        const foundPagePostUpdate = await storageManager
            .collection('pages')
            .findObject<Page>({ url: DATA.testPageA.url })

        // stored page in DB should have updated title + appended title terms
        compareDBPageWithPageData(foundPagePostUpdate, {
            ...DATA.testPageA,
            fullTitle: updatedTitle,
            titleTerms: [...updatedTitleTerms, ...DATA.testPageA.titleTerms],
        })
    })

    it('should be able to update/save an existing page with new visits, without re-saving existing visits', async () => {
        const { storageManager } = await setupTest()

        const page = new Page(storageManager, DATA.testPageA)
        page.addVisit(DATA.visitTimeA)
        page.addVisit(DATA.visitTimeB)
        await page.save()

        // All visits should be new, thus marked as "hasChanged"
        page.visits.forEach(visit => expect(visit.hasChanged).toBe(true))

        // Add a new visit that doesn't yet exist
        page.addVisit(DATA.visitTimeC)
        await page.save()

        // Only the latest visit should be new, thus marked as "hasChanged"
        page.visits.forEach(visit => {
            if (visit.time === DATA.visitTimeC) {
                expect(visit.hasChanged).toBe(true)
            } else {
                expect(visit.hasChanged).toBe(false)
            }
        })
    })
})
