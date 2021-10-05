export async function blobToBuffer(blob: Blob): Promise<ArrayBuffer> {
    return convertBlob<ArrayBuffer>(blob, (reader) =>
        reader.readAsArrayBuffer(blob),
    )
}

export async function blobToString(blob: Blob) {
    return convertBlob<string>(blob, (reader) => reader.readAsText(blob))
}

export async function blobToJson(blob: Blob) {
    return JSON.parse(await blobToString(blob))
}

export async function bufferToBlob(buffer: ArrayBuffer): Promise<Blob> {
    return new Blob([buffer])
}

export async function convertBlob<T extends ArrayBuffer | string>(
    blob: Blob,
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
