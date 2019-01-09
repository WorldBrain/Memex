import { remoteFunction } from 'src/util/webextensionRPC'

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
