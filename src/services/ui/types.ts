import { OverlayServiceInterface } from '@worldbrain/memex-common/lib/services/overlay/types'
import { LogicRegistryServiceInterface } from '@worldbrain/memex-common/lib/services/logic-registry/types'
import { ClipboardServiceInterface } from '@worldbrain/memex-common/lib/services/clipboard/types'
import { DeviceServiceInterface } from '@worldbrain/memex-common/lib/services/device/types'

export interface UIServices {
    device: DeviceServiceInterface
    overlay: OverlayServiceInterface
    clipboard: ClipboardServiceInterface
    logicRegistry: LogicRegistryServiceInterface
}
