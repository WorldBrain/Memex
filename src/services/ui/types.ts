import { OverlayServiceInterface } from '@worldbrain/memex-common/ts/services/overlay/types'
import { LogicRegistryServiceInterface } from '@worldbrain/memex-common/ts/services/logic-registry/types'
import { ClipboardServiceInterface } from '@worldbrain/memex-common/ts/services/clipboard/types'
import { DeviceServiceInterface } from '@worldbrain/memex-common/ts/services/device/types'

export interface UIServices {
    device: DeviceServiceInterface
    overlay: OverlayServiceInterface
    clipboard: ClipboardServiceInterface
    logicRegistry: LogicRegistryServiceInterface
}
