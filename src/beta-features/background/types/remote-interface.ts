import type { ReadwiseAPIResponse } from '@worldbrain/memex-common/lib/readwise-integration/api/types'
import type {
    RemoteFunctionRole,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import type { Annotation } from 'src/annotations/types'

export interface BetaFeatureInterface<Role extends RemoteFunctionRole> {
    // validateAPIKey: RemoteFunctionWithoutExtraArgs<
    //     Role,
    //     { key: string },
    //     ReadwiseAPIResponse
    // >
}
