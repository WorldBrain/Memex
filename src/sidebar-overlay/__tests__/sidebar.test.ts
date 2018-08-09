import puppeteer from 'puppeteer'

// TODO: Find a way to import styles.
// import styles from 'src/overview/components/PageResultItem.css'

const EXT_PATH = 'extension'
const EXT_ID = 'alnbjhgekjgejonkjfkdnfohblemabal'

jest.setTimeout(100000)
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000

describe('Memex overview test', async () => {
    let page
    let browser
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${EXT_PATH}`,
                `--load-extension=${EXT_PATH}`,
                '--user-agent=PuppeteerAgent',
            ],
        })
        page = await browser.newPage()
        await page.goto(
            'chrome-extension://' + EXT_ID + '/options.html#/overview',
            {
                waitUntil: 'domcontentloaded',
            },
        )
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

    test('Check if sidebar opens', async () => {
        page.waitForSelector('#app a[draggable=true]')
        const $commentButton = (await page.$$(
            '#app a[draggable=true] button',
        ))[1]
        $commentButton.click()
        const $menu = await page.waitForSelector('.bm-menu')
        expect($menu).toBeDefined()
        expect($menu).not.toBeNull()
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
        await browser.close()
    })
})
