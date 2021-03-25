import { OverlayServiceInterface } from '@worldbrain/memex-common/lib/services/overlay/types'
import { LogicRegistryServiceInterface } from '@worldbrain/memex-common/lib/services/logic-registry/types'

export interface UIServices {
    overlay: OverlayServiceInterface
    logicRegistry: LogicRegistryServiceInterface
}
