export default function decodeBlob(
    dataURL: string,
    options?: { blobClass?: typeof Blob; atobFunction?: typeof atob },
) {
    const blobClass = (options && options.blobClass) || Blob
    const atobFunction = (options && options.atobFunction) || atob

    const dataURLPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/

    // parse the dataURL components as per RFC 2397
    const matches = dataURL.match(dataURLPattern)
    if (!matches) {
        throw new Error('invalid dataURI')
    }

    // default to text/plain;charset=utf-8
    const mediaType = matches[2]
        ? matches[1]
        : 'text/plain' + (matches[3] || ';charset=utf-8')

    const isBase64 = !!matches[4]
    const dataString = dataURL.slice(matches[0].length)
    const byteString = isBase64
        ? // convert base64 to raw binary data held in a string
          atobFunction(dataString)
        : // convert base64/URLEncoded data component to raw binary
          decodeURIComponent(dataString)

    const array = []
    for (let i = 0; i < byteString.length; ++i) {
        array.push(byteString.charCodeAt(i))
    }

    return new blobClass([new Uint8Array(array)], { type: mediaType })
}
