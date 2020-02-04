import { browser } from 'webextension-polyfill-ts'
import { remoteFunction } from 'src/util/webextensionRPC'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import * as constants from './constants'

/**
 * Calculates the number of pixels from the starting of the webpage.
 * @param {HTMLElement} element DOM element to calculate the offsetTop.
 * @returns The number of pixels from the starting of the webpage.
 */
export const getOffsetTop = (element: HTMLElement) => {
    let el = element
    let offset = 0
    while (el) {
        offset = offset + el.offsetTop
        el = el.offsetParent as HTMLElement
    }
    return offset
}

export const getSidebarState = async () =>
    getLocalStorage(
        constants.SIDEBAR_STORAGE_NAME,
        constants.SIDEBAR_DEFAULT_OPTION,
    )

export const setSidebarState = async (enabled: boolean) =>
    setLocalStorage(constants.SIDEBAR_STORAGE_NAME, enabled)

export const getExtUrl = (location: string) =>
    browser.runtime ? browser.runtime.getURL(location) : location

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
 * Given a list of tags, computes the maximum possible number of tags the
 * container can hold without overflowing.
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
export const toggleSidebarOverlay = remoteFunction('toggleSidebarOverlay')
