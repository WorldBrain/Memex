import { UploadImageParams } from '@worldbrain/memex-common/lib/image-support/types'
import {
    RemoteFunction,
    RemoteFunctionRole,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'

export interface ImageSupportInterface<Role extends RemoteFunctionRole> {
    uploadImage: RemoteFunctionWithoutExtraArgs<Role, UploadImageParams, void>
}
