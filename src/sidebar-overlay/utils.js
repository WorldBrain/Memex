import { RetryTimeoutError } from '../direct-linking/utils'
import { remoteFunction } from '../util/webextensionRPC'

/**
 * Keeps executing a promiseCreator function till no error is thrown.
 */
export function retryUntilErrorResolves(
    promiseCreator,
    { intervalMiliseconds, timeoutMiliseconds },
) {
    const startMs = Date.now()
    return new Promise((resolve, reject) => {
        const doTry = async () => {
            let res
            try {
                res = await promiseCreator()
                resolve(res)
                return true
            } catch (e) {
                return false
            }
        }

        const tryOrRetryLater = async () => {
            if (await doTry()) {
                resolve(true)
                return
            }

            if (Date.now() - startMs >= timeoutMiliseconds) {
                return reject(new RetryTimeoutError())
            }

            setTimeout(tryOrRetryLater, intervalMiliseconds)
        }

        tryOrRetryLater()
    })
}

// Compute the maximum width of a Tag pill
const avgLetterPx = 8
// Padding + Margin + X button
const tagPillExtra = 10 + 8 + 12
const tagContainerWidth = 240

const computeTagPillWidth = letters => letters * avgLetterPx + tagPillExtra

/**
 * Given a list of tags, computes the maximum possible of tags the container can
 * hold without overflowing.
 * @param {Array<String>} tags Array of tag names
 * @returns {Number} Maximum possible tags the container can hold.
 */
export const maxPossibleTags = tags => {
    let totalTagsWidth = 0
    let tagsAllowed = 0
    while (tagsAllowed < tags.length) {
        const tag = tags[tagsAllowed].name
        totalTagsWidth += computeTagPillWidth(tag.length)
        if (totalTagsWidth >= tagContainerWidth) {
            break
        }
        tagsAllowed++
    }
    return tagsAllowed
}

/**
 * HOF to return a function which
 * Scrolls to annotation or creates a new tab and then scrolls to annotation
 * Depending on the environment of the sidebar.
 * @param {*} annotation The annotation to go to.
 * @param {string} env The sidebar enviroment in which the function is being executed.
 * @param {string} pageUrl Url of the page highlight is in.
 * @param {function} highlightAndScroll Remote function which gets the passed annotation
 * @returns {Promise<function>}
 */

export const goToAnnotation = (
    env,
    pageUrl,
    highlightAndScroll,
) => annotation => async () => {
    // If annotation is a comment, do nothing
    if (!annotation.body) {
        return false
    } else if (env === 'overview') {
        const tab = await browser.tabs.create({
            active: true,
            url: pageUrl,
        })

        const listener = (tabId, changeInfo) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                remoteFunction('goToAnnotation', {
                    tabId: tab.id,
                })(annotation)
                browser.tabs.onUpdated.removeListener(listener)
            }
        }

        browser.tabs.onUpdated.addListener(listener)
    } else {
        highlightAndScroll(annotation)
    }
}

/**
 * Calculates the number of pixels from the starting of the webpage.
 * @param {HTMLElement} element DOM element to calculate the offsetTop.
 * @returns The number of pixels from the starting of the webpage.
 */
export const getOffsetTop = element => {
    let el = element
    let offset = 0
    while (el) {
        offset = offset + el.offsetTop
        el = el.offsetParent
    }
    return offset
}
