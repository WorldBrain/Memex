import * as webdriver from 'selenium-webdriver'
import expect from 'expect'

import { makeTestFactory } from 'src/tests/selenium/setup'
import {
    locateShadowDomElement,
    triggerRibbonShow,
} from 'src/tests/selenium/helpers'
import { EXT_OVERVIEW_URL } from 'src/tests/selenium/constants'
import * as overviewSelectors from 'src/tests/selenium/selectors/overview'
import * as sidebarSelectors from 'src/tests/selenium/selectors/sidebar'

describe('Bookmark browser tests', function () {
    this.timeout(60000) // Needed to bypass 2s mocha timeuot

    const it = makeTestFactory()

    it('should bookmark a page from the ribbon, and that bookmark be present in search results for bookmarks', async function ({
        driver,
    }) {
        // Navigate to a new page
        await driver.get('https://en.wikipedia.org/wiki/Memex')

        const ribbonSidebar = await locateShadowDomElement({
            elementLocator: webdriver.By.id('memex-ribbon-sidebar'),
            driver,
        })

        await triggerRibbonShow({ driver, ribbonSidebar })

        // Click on the bookmark button
        const bookmarkBtn = await ribbonSidebar.findElement(
            webdriver.By.css(
                sidebarSelectors.ribbonPageActionBtn({ btnIndex: 0 }),
            ),
        )

        await bookmarkBtn.click()
        await driver.sleep(500)

        // Do a bookmarks filtered page search
        const bookmarksUrl = EXT_OVERVIEW_URL + '?showOnlyBookmarks=true'
        await driver.get(bookmarksUrl)
        await driver.sleep(500)

        // Test that there should be only one bookmarked page
        const pageResults = await driver.wait(
            webdriver.until.elementsLocated(
                webdriver.By.css(
                    overviewSelectors.searchResultsList() + ' > li',
                ),
            ),
            5000,
        )

        expect(pageResults).toHaveLength(1)

        // Test that the result should be the bookmarked page
        const pageTitle = await driver.wait(
            webdriver.until.elementLocated(
                webdriver.By.css(
                    overviewSelectors.pageResultTitle({ resultIndex: 0 }),
                ),
            ),
            2000,
        )
        const titleText = await pageTitle.getText()

        expect(titleText).toEqual('Memex - Wikipedia')
    })
})
