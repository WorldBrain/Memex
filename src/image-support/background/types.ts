import {
    FrontendUploadImageParams,
    GetImageUrlParams,
    GetImageUrlResult,
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
        FrontendUploadImageParams,
        UploadImageResult
    >
    getImageUrl: RemoteFunctionWithoutExtraArgs<
        Role,
        GetImageUrlParams,
        GetImageUrlResult
    >
}
