// Turn a fetch() response into data URI (does this have to be so convoluted?)
export default function responseToDataURI(response) {
    return response.blob().then(
        blob => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
        })
    )
}
