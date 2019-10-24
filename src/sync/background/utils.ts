import encodeBlob from 'src/util/encode-blob'
import decodeBlob from 'src/util/decode-blob'
import { blobToBuffer } from 'src/util/blob-utils'

export async function uint8ArrayToBase64(array: Uint8Array): Promise<string> {
    const serialized = await encodeBlob(new Blob([array]))
    return serialized
}

export async function stringToUint8Array(
    encodedString: string,
    options?: { charset?: string },
): Promise<Uint8Array> {
    const type =
        options && options.charset ? `charset=${options.charset}` : 'base64'
    return new Uint8Array(
        await blobToBuffer(
            decodeBlob(`data:text/plain;${type},${encodedString}`),
        ),
    )
}

export function ab2str(buf: ArrayBuffer): string {
    return String.fromCharCode.apply(null, new Uint8Array(buf))
}

export function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
    const bufView = new Uint16Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i)
    }
    return buf
}
