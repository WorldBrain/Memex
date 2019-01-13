import { browser, Tabs } from 'webextension-polyfill-ts'

import { remoteFunction } from '../util/webextensionRPC'
import { Annotation } from './types'

// TODO: Perhaps move RPC calls to some sort of a manager.
const openOptionsTabRPC = remoteFunction('openOptionsTab')

export const openSettings = () => openOptionsTabRPC('settings')

// Compute the maximum width of a Tag pill
const avgLetterPx = 8
// Padding + Margin + X button
const tagPillExtra = 10 + 8 + 12
const tagContainerWidth = 240

const computeTagPillWidth = (letters: number) =>
    letters * avgLetterPx + tagPillExtra

/**
 * Given a list of tags, computes the maximum possible of tags the container can
 * hold without overflowing.
 * @param {Array<String>} tags Array of tag names
 * @returns {Number} Maximum possible tags the container can hold.
 */
export const maxPossibleTags = (tags: string[]) => {
    let totalTagsWidth = 0
    let tagsAllowed = 0
    while (tagsAllowed < tags.length) {
        const tag = tags[tagsAllowed]
        totalTagsWidth += computeTagPillWidth(tag.length)
        if (totalTagsWidth >= tagContainerWidth) {
            break
        }
        tagsAllowed++
    }
    return tagsAllowed
}

/**
 * HOF to return a function which takes in an `annotation`, and
 * scrolls to that annotation (in-page),
 * or creates a new tab and then scrolls to that annotation (overview).
 *
 * Behavior depends on the environment of the sidebar.
 * First-order arguments are those that are not expected to change for a
 * certain environment.
 */
export const goToAnnotation = (
    env: 'inpage' | 'overview',
    pageUrl: string,
    callback: (annotation: Annotation) => void,
) => {
    if (env === 'inpage') {
        const handleGoToAnnotationInPage = (annotation: Annotation) => {
            if (!annotation.body) {
                return
            }

            callback(annotation)
        }

        return handleGoToAnnotationInPage
    }

    const handleGoToAnnotationInOverview = async (annotation: Annotation) => {
        if (!annotation.body) {
            return
        }

        const tab = await browser.tabs.create({
            active: true,
            url: annotation.url,
        })

        const listener = (
            tabId: number,
            changeInfo: Tabs.OnUpdatedChangeInfoType,
        ) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                remoteFunction('goToAnnotation', {
                    tabId,
                })(annotation)
                browser.tabs.onUpdated.removeListener(listener)
            }
        }

        browser.tabs.onUpdated.addListener(listener)
    }

    return handleGoToAnnotationInOverview
}
