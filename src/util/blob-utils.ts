export async function blobToBuffer(blob: Blob): Promise<ArrayBuffer> {
    return setupFileReader<ArrayBuffer>((reader) =>
        reader.readAsArrayBuffer(blob),
    )
}

export async function blobToDataURL(blob: Blob) {
    return setupFileReader<string>((reader) => reader.readAsDataURL(blob))
}

export async function blobToString(blob: Blob) {
    return setupFileReader<string>((reader) => reader.readAsText(blob))
}

export async function blobToJson(blob: Blob) {
    return JSON.parse(await blobToString(blob))
}

export async function bufferToBlob(buffer: ArrayBuffer): Promise<Blob> {
    return new Blob([buffer])
}

async function setupFileReader<T extends ArrayBuffer | string>(
    triggerRead: (reader: FileReader) => void,
) {
    const fileReader = new FileReader()
    const promise = new Promise<T>((resolve, reject) => {
        fileReader.onload = () => {
            const arrayBuffer = fileReader.result as T
            resolve(arrayBuffer)
        }
        fileReader.onerror = (err) => {
            reject(err)
        }
    })
    triggerRead(fileReader)
    return promise
}
