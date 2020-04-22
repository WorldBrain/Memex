import { WebDriver, Builder, Capabilities } from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import 'chromedriver'
import expect from 'expect'

import { EXT_PATH_UNPACKED, EXT_OVERVIEW_URL } from './constants'

export interface TestSetupProps {
    initUrl?: string
}

export interface TestDependencies {
    driver: WebDriver
}

export function setupChromeDriverWithExtension(props: {
    maximizeWindow?: boolean
}): WebDriver {
    const options = new Options()
    options.addArguments('--load-extension=' + EXT_PATH_UNPACKED)
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

            await test(deps)

            await deps.driver.quit()
        })
    }
}
