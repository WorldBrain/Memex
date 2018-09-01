import { getMemexPage, killBrowser } from './Puppeteer'

jest.setTimeout(100000)
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000

describe('Memex Sidebar Test Suite', async () => {
    let page

    beforeAll(async () => {
        page = await getMemexPage()
    })

    test('Verify title of overview', async () => {
        const title = await page.title()
        expect(title).toBe('🔍 Results')
    })

    test('Check if inserted page entry exists', async () => {
        await page.reload(10000, {
            waitUntil: 'networkidle0',
        })
        await page.waitForSelector('#app a[draggable=true]')
        const listCount = await page.$$eval(
            '#app a[draggable=true]',
            items => items.length,
        )
        expect(listCount).toBe(1)
        expect(listCount).not.toBeNull()
    })

    const openSidebar = async () => {
        await page.waitForSelector('#app a[draggable=true]')
        const $commentButton = (await page.$$(
            '#app a[draggable=true] button',
        ))[1]
        $commentButton.click()
    }

    test('Check if sidebar opens', async () => {
        await openSidebar()
        const $menu = await page.waitForSelector('#memex_sidebar_panel')
        expect($menu).toBeDefined()
        expect($menu).not.toBeNull()
    })

    const expectSidebarToBeClosed = async () => {
        await page.waitFor(500)
        const $menu = await page.$('#memex_sidebar_panel')
        expect($menu).toBeNull()
    }

    test('Check if sidebar closes through close button', async () => {
        const $closeButton = await page.waitForSelector(
            '#memex_sidebar_close_btn',
        )
        $closeButton.click()
        await expectSidebarToBeClosed()
    })

    test('Check if sidebar closes through outside', async () => {
        const $input = await page.$('input')
        $input.click()
        await expectSidebarToBeClosed()
    })

    test('Test if loading indicator is shown', async () => {
        await openSidebar()
        const loader = await page.waitForSelector('#memex_sidebar_loader')
        expect(loader).toBeDefined()
        expect(loader).not.toBeNull()
    })

    test('Check if empty annotation message is present', async () => {
        const URL = 'https://worldbrain.helprace.com/i66-annotations-comments'
        const $emptyMessage = await page.waitForSelector(
            `.bm-menu a[href="${URL}"]`,
        )
        expect($emptyMessage).toBeDefined()
        expect($emptyMessage).not.toBeNull()
    })

    afterAll(async () => {
        await killBrowser()
    })
})
