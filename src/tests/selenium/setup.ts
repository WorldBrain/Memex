import { WebDriver, Builder, Capabilities } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import firefox from 'selenium-webdriver/firefox'
import 'chromedriver'
import 'geckodriver'
import expect from 'expect'

import {
    EXT_PATH_UNPACKED,
    EXT_PATH_PACKED,
    EXT_OVERVIEW_URL,
} from './constants'

export interface TestSetupProps {
    initUrl?: string
}

export interface TestDependencies {
    driver: WebDriver
}

export function setupFirefoxDriverWithExtension(props: {}): WebDriver {
    const options = new firefox.Options()
        .setBinary('/Applications/Firefox Developer Edition.app') // TODO: This is specific to my install of macOS - not yet ready for CI
        .setPreference('xpinstall.signatures.required', false) // NOTE: This option is only available on FF dev edition or nightly builds
        .addExtensions(EXT_PATH_PACKED)

    const driver = new Builder()
        .withCapabilities(Capabilities.firefox())
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build()

    return driver
}

export function setupChromeDriverWithExtension(props: {
    maximizeWindow?: boolean
}): WebDriver {
    const options = new chrome.Options().addArguments(
        '--load-extension=' + EXT_PATH_UNPACKED,
    )

    const driver = new Builder()
        .withCapabilities(Capabilities.chrome())
        .setChromeOptions(options)
        .build()

    if (props.maximizeWindow) {
        driver.manage().window().maximize()
    }

    return driver
}

export async function setupTest({
    initUrl = EXT_OVERVIEW_URL,
}: TestSetupProps): Promise<TestDependencies> {
    const driver = await setupChromeDriverWithExtension({
        maximizeWindow: true,
    })
    // const driver = await setupFirefoxDriverWithExtension({})

    await driver.get(initUrl)
    const currentUrl = await driver.getCurrentUrl()
    expect(currentUrl).toContain(initUrl)

    // The new installation tab often pops up and steals focus
    // Make sure focus is set to the tab we set
    await driver.switchTo().window((await driver.getAllWindowHandles())[0])

    return { driver }
}

export function makeTestFactory() {
    type TestFunction = (deps: TestDependencies) => Promise<void>

    return async function (
        description: string,
        test: TestFunction,
        props?: TestSetupProps,
    ) {
        it(description, async () => {
            const deps = await setupTest(props ?? {})

            try {
                await test(deps)
            } catch (err) {
                throw err
            } finally {
                await deps.driver.quit()
            }
        })
    }
}
