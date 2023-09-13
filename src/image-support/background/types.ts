import {
    GetImageUrlParams,
    GetImageUrlResult,
    UploadImageParams,
    UploadImageResult,
} from '@worldbrain/memex-common/lib/image-support/types'
import {
    RemoteFunctionRole,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'

export interface ImageSupportInterface<Role extends RemoteFunctionRole> {
    generateImageId: RemoteFunctionWithoutExtraArgs<Role, void, string>
    uploadImage: RemoteFunctionWithoutExtraArgs<
        Role,
        UploadImageParams & {
            normalizedPageUrl: string
            annotationUrl?: string
        },
        UploadImageResult
    >
    getImageUrl: RemoteFunctionWithoutExtraArgs<
        Role,
        GetImageUrlParams,
        GetImageUrlResult
    >
}
