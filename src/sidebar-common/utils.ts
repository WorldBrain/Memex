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

export const getTagArrays: (
    oldTags: string[],
    newTags: string[],
) => { tagsToBeAdded: string[]; tagsToBeDeleted: string[] } = (
    oldTags,
    newTags,
) => {
    const oldSet = new Set(oldTags)
    const tagsToBeAdded = newTags.reduce((accumulator, currentTag) => {
        if (!oldSet.has(currentTag)) {
            accumulator.push(currentTag)
        }
        return accumulator
    }, [])

    const newSet = new Set(newTags)
    const tagsToBeDeleted = oldTags.reduce((accumulator, currentTag) => {
        if (!newSet.has(currentTag)) {
            accumulator.push(currentTag)
        }
        return accumulator
    }, [])

    return {
        tagsToBeAdded,
        tagsToBeDeleted,
    }
}
