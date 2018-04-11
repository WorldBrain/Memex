const dataURLPattern = /^data:.+\/.+;base64,(.*)$/

exports.dataURLToBlob = url =>
    new Promise((resolve, reject) => {
        try {
            const [, data] = url.match(dataURLPattern)
            const mockBlob = Buffer.from(data, 'base64')

            // Blob has a `type` property; mock this on our `Buffer` instance
            mockBlob.type = 'image/png'
            resolve(mockBlob)
        } catch (err) {
            reject(err)
        }
    })

exports.blobToBase64String = buffer =>
    Promise.resolve(buffer.toString('base64'))
