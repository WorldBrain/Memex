import docuri from 'docuri'
import randomString from 'src/util/random-string'

export const pageKeyPrefix = 'page/'

export const convertPageDocId = docuri.route(`${pageKeyPrefix}:timestamp/:nonce`)

export function generatePageDocId({timestamp, nonce} = {}) {
    const date = timestamp ? new Date(timestamp) : new Date()
    return convertPageDocId({
        timestamp: date.getTime(),
        nonce: nonce || randomString(),
    })
}
