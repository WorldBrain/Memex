import type StorageManager from '@worldbrain/storex'
import { ImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/types'
import { ImageSupportClientStorage } from '@worldbrain/memex-common/lib/image-support/client-storage'
import {
    registerRemoteFunctions,
    remoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import { ImageSupportInterface } from './types'

export class ImageSupportBackground {
    remoteFunctions: ImageSupportInterface<'provider'>
    storage: ImageSupportClientStorage

    constructor(
        public options: {
            storageManager: StorageManager
            backend: ImageSupportBackend
            generateImageId(): string
        },
    ) {
        this.remoteFunctions = {
            generateImageId: remoteFunctionWithoutExtraArgs(
                this.generateImageId,
            ),
            uploadImage: remoteFunctionWithoutExtraArgs(this.uploadImage),
            getImageUrl: remoteFunctionWithoutExtraArgs(this.getImageUrl),
        }
        this.storage = new ImageSupportClientStorage({
            storageManager: options.storageManager,
        })
    }

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    generateImageId: ImageSupportInterface<
        'provider'
    >['generateImageId']['function'] = async () => {
        return this.options.generateImageId()
    }

    uploadImage: ImageSupportInterface<
        'provider'
    >['uploadImage']['function'] = async (params) => {
        console.log('params2', params)

        const blob = dataURLToBlob(params.image)

        await this.options.backend.uploadImage({ image: blob, id: params.id })
        await this.storage.storeImage({
            id: params.id,
            createdWhen: Date.now(),
            normalizedPageUrl: params.normalizedPageUrl,
            annotation: params.annotationUrl,
        })
    }

    getImageUrl: ImageSupportInterface<
        'provider'
    >['getImageUrl']['function'] = async (params) => {
        return this.options.backend.getImageUrl(params)
    }
}

function dataURLToBlob(dataurl) {
    const parts = dataurl.split(',')
    const byteString = atob(parts[1])
    const mime = parts[0].split(':')[1].split(';')[0]
    const buffer = new Uint8Array(byteString.length)

    for (let i = 0; i < byteString.length; i++) {
        buffer[i] = byteString.charCodeAt(i)
    }

    return new Blob([buffer], { type: mime })
}
