import { ActionQueueInteraction } from '@worldbrain/memex-common/lib/action-queue/types'
import {
    RemoteFunctionRole,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import { ReadwiseAPIKeyValidation } from './api'

export interface ReadwiseInterface<Role extends RemoteFunctionRole> {
    validateAPIKey: RemoteFunctionWithoutExtraArgs<
        Role,
        { key: string },
        ReadwiseAPIKeyValidation
    >
    getAPIKey: RemoteFunctionWithoutExtraArgs<Role, void, string>
    setAPIKey: RemoteFunctionWithoutExtraArgs<
        Role,
        { validatedKey: string },
        void
    >
    uploadAllAnnotations: RemoteFunctionWithoutExtraArgs<
        Role,
        { queueInteraction: ActionQueueInteraction },
        void
    >
}
