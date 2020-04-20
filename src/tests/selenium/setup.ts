import { WebDriver, Builder, Capabilities } from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import 'chromedriver'
import expect from 'expect'

import { EXT_PATH_UNPACKED, EXT_OVERVIEW_URL } from './constants'

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
        driver
            .manage()
            .window()
            .maximize()
    }

    return driver
}

export async function setupTest({
    driver,
    initUrl = EXT_OVERVIEW_URL,
}: {
    driver: WebDriver
    initUrl?: string
}) {
    await driver.get(initUrl)
    const currentUrl = await driver.getCurrentUrl()
    expect(currentUrl).toContain(initUrl)

    // The new installation tab often pops up and steals focus
    // Make sure focus is set to the tab we set
    await driver.switchTo().window((await driver.getAllWindowHandles())[0])
}
