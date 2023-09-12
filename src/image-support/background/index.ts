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
        return this.options.backend.uploadImage(params)
    }

    getImageUrl: ImageSupportInterface<
        'provider'
    >['getImageUrl']['function'] = async (params) => {
        return this.options.backend.getImageUrl(params)
    }
}
