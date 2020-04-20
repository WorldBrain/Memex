import { By, WebElement, WebDriver, Locator } from 'selenium-webdriver'

import { DEFAULT_SHADOW_ROOT_ID } from './constants'
import { ribbonTriggerRoot } from './selectors/sidebar'
import { Selector } from './selectors/types'

export interface RequiredProps {
    driver: WebDriver
}

export interface LocateShadowRootProps extends RequiredProps {
    shadowRootLocator?: Locator
}

export async function locateShadowRoot(
    props: LocateShadowRootProps,
): Promise<WebElement> {
    props.shadowRootLocator =
        props.shadowRootLocator ?? By.id(DEFAULT_SHADOW_ROOT_ID)

    const shadowHost = await props.driver.findElement(props.shadowRootLocator)

    return props.driver.executeScript(
        'return arguments[0].shadowRoot',
        shadowHost,
    )
}

export async function locateShadowDomElement(
    props: {
        elementLocator: Locator
        waitTimeout?: number
    } & LocateShadowRootProps,
): Promise<WebElement> {
    props.waitTimeout = props.waitTimeout ?? 5000

    const shadowRoot = await locateShadowRoot(props)
    return props.driver.wait(
        async () => shadowRoot.findElement(props.elementLocator),
        props.waitTimeout,
    )
}

export async function triggerRibbonShow(
    props: {
        ribbonSidebar: WebElement
        ribbonTriggerSelector?: Selector
        sleepTimeout?: number
    } & RequiredProps,
) {
    props.sleepTimeout = props.sleepTimeout ?? 1000
    props.ribbonTriggerSelector =
        props.ribbonTriggerSelector ?? ribbonTriggerRoot

    const ribbonTrigger = await props.ribbonSidebar.findElement(
        By.css(props.ribbonTriggerSelector()),
    )

    await props.driver
        .actions({ bridge: true })
        .move({ x: 0, y: 0, origin: ribbonTrigger })
        .perform()

    await props.driver.sleep(props.sleepTimeout)
}
