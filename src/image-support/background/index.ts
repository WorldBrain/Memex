import type StorageManager from '@worldbrain/storex'
import { ImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/types'
import { ImageSupportClientStorage } from '@worldbrain/memex-common/lib/image-support/client-storage'
import {
    registerRemoteFunctions,
    remoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import { ImageSupportInterface } from './types'
import { dataUrlToBlob } from '@worldbrain/memex-common/lib/utils/blob-to-data-url'

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
        try {
            this.storage = new ImageSupportClientStorage({
                storageManager: options.storageManager,
            })
        } catch (e) {
            console.error(e)
            throw new Error(`Failed to initialize image support storage`)
        }
        this.remoteFunctions = {
            generateImageId: remoteFunctionWithoutExtraArgs(async () =>
                this.generateImageId(),
            ),
            uploadImage: remoteFunctionWithoutExtraArgs(this.uploadImage),
            getImageUrl: remoteFunctionWithoutExtraArgs(this.getImageUrl),
        }
    }

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    generateImageId = () => {
        return this.options.generateImageId()
    }

    uploadImage: ImageSupportInterface<
        'provider'
    >['uploadImage']['function'] = async (params) => {
        await this.storage.storeImage({
            id: params.id,
            createdWhen: Date.now(),
            normalizedPageUrl: params.normalizedPageUrl,
            annotationUrl: params.annotationUrl,
        })

        const blob =
            params.image instanceof Blob
                ? params.image
                : dataUrlToBlob(params.image)

        await this.options.backend.uploadImage({ image: blob, id: params.id })
    }

    getImageUrl: ImageSupportInterface<
        'provider'
    >['getImageUrl']['function'] = async (params) => {
        return this.options.backend.getImageUrl(params)
    }
}
