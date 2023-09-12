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
        },
    ) {
        this.remoteFunctions = {
            uploadImage: remoteFunctionWithoutExtraArgs(this.uploadImage),
        }
    }

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    uploadImage: ImageSupportInterface<
        'provider'
    >['uploadImage']['function'] = async (params) => {
        return this.options.backend.uploadImage(params)
    }
}
