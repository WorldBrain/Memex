import type { ReadwiseAPIResponse } from '@worldbrain/memex-common/lib/readwise-integration/api/types'
import type {
    RemoteFunctionRole,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import type { Annotation } from 'src/annotations/types'

export interface ReadwiseInterface<Role extends RemoteFunctionRole> {
    validateAPIKey: RemoteFunctionWithoutExtraArgs<
        Role,
        { key: string },
        ReadwiseAPIResponse
    >
    getAPIKey: RemoteFunctionWithoutExtraArgs<Role, void, string | null>
    setAPIKey: RemoteFunctionWithoutExtraArgs<
        Role,
        { validatedKey: string },
        void
    >
    uploadAllAnnotations: RemoteFunctionWithoutExtraArgs<
        Role,
        {
            annotationFilter?: (annotation: Annotation) => boolean
        },
        void
    >
}
