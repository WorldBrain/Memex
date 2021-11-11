export const loadBlob = ({
    url,
    timeout,
    responseType,
}: {
    url: string
    timeout: number
    responseType?: any
}) => {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest()
        req.timeout = timeout
        req.responseType = responseType
        req.open('GET', url, true)
        req.onload = () => resolve(req.response)
        req.onerror = () => reject(req.statusText)
        req.send()
    })
}

const padShortTimestamp = (timestamp: number) => {
    // assuming input is correct (shorter than expected)
    const timestampStr = timestamp.toString()
    const expectedLength = Date.now().toString().length
    const actualLength = timestampStr.length

    const difference = expectedLength - actualLength

    const newTimestampStr = timestampStr + '0'.repeat(difference)
    return Number.parseInt(newTimestampStr, 10)
}

const shaveLongTimestamp = (timestamp: number) => {
    // assuming input is correct (longer than expected)
    const timestampStr = timestamp.toString()
    const expectedLength = Date.now().toString().length

    const newTimestampStr = timestampStr.slice(0, expectedLength)
    return Number.parseInt(newTimestampStr, 10)
}

export const normalizeTimestamp = (timestamp: number) => {
    const timestampStr = timestamp.toString()
    const expectedLength = Date.now().toString().length
    const actualLength = timestampStr.length

    const difference = expectedLength - actualLength

    if (difference === 0) {
        return timestamp
    }

    if (difference > 0) {
        return padShortTimestamp(timestamp)
    }

    if (difference < 0) {
        return shaveLongTimestamp(timestamp)
    }
    return timestamp
}
