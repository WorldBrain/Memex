import { RetryTimeoutError } from '../direct-linking/utils'

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

// Compute the maximum width of a  Tag pill
const avgLetterPx = 6
const tagPillPadding = 10
const tagPillMarginRight = 8
const tagContainerWidth = 240

const computeTagPillWidth = letters =>
    letters * avgLetterPx + tagPillPadding + tagPillMarginRight

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
        const tag = tags[tagsAllowed]
        totalTagsWidth += computeTagPillWidth(tag.length)
        if (totalTagsWidth >= tagContainerWidth) break
        tagsAllowed++
    }
    return tagsAllowed
}

window.mpt = maxPossibleTags
