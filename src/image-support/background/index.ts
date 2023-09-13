import { ImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/types'
import {
    registerRemoteFunctions,
    remoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import { ImageSupportInterface } from './types'

export class ImageSupportBackground {
    remoteFunctions: ImageSupportInterface<'provider'>

    constructor(
        public options: {
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

        return this.options.backend.uploadImage({ image: blob, id: params.id })
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
