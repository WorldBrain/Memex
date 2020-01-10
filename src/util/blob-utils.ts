export async function blobToBuffer(blob: Blob): Promise<ArrayBuffer> {
    const fileReader = new FileReader()
    const promise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => {
            const arrayBuffer = fileReader.result as ArrayBuffer
            resolve(arrayBuffer)
        }
        fileReader.onerror = err => {
            reject(err)
        }
    })

    fileReader.readAsArrayBuffer(blob)
    return promise
}

export async function bufferToBlob(buffer: ArrayBuffer): Promise<Blob> {
    return new Blob([buffer])
}
