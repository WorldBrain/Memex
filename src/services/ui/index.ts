import { DeviceServiceInterface } from '@worldbrain/memex-common/lib/services/device/types'
import LogicRegistryService from '@worldbrain/memex-common/lib/services/logic-registry'
import OverlayService from '@worldbrain/memex-common/lib/services/overlay'

import type { UIServices } from './types'
import { copyToClipboard } from 'src/annotations/content_script/utils'

export function createServices(): UIServices {
    return {
        device: {} as DeviceServiceInterface, // TODO: properly implement this service (currently unused)
        overlay: new OverlayService(),
        logicRegistry: new LogicRegistryService(),
        clipboard: {
            copy: async (text) => {
                await copyToClipboard(text)
            },
        },
    }
}
