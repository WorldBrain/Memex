import puppeteer from 'puppeteer'

const EXT_PATH = 'extension'
const EXT_ID = 'alnbjhgekjgejonkjfkdnfohblemabal'

jest.setTimeout(100000)
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000

describe('Memex bootup test', async () => {
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
                waitUntil: 'networkidle0',
            },
        )
    })

    test(
        'title of overview',
        async () => {
            const title = await page.title()
            expect(title).toBe('🔍 Results')
        },
        100000,
    )

    afterAll(async () => {
        await browser.close()
    })
})
