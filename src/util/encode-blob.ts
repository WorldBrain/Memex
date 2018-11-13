export default (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob)

        reader.onloadend = function() {
            let result = reader.result as string

            // Remove `data:*/*;base64,` prefix:
            //   https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
            result = result.split(',')[1]

            resolve(result)
        }

        reader.onerror = function() {
            reject(reader.error)
        }
    })
