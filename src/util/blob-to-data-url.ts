export const blobToDataUrl = async (blob: Blob): Promise<string> =>
    new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.toString())
        reader.onerror = () => rej(reader.error)
        reader.readAsDataURL(blob)
    })
