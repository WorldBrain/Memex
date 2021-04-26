import { DeviceServiceInterface } from '@worldbrain/memex-common/lib/services/device/types'
import LogicRegistryService from '@worldbrain/memex-common/lib/services/logic-registry'
import OverlayService from '@worldbrain/memex-common/lib/services/overlay'

import type { UIServices } from './types'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { EventEmitter } from 'events'

// TODO: properly implement this service
class MockDeviceService implements DeviceServiceInterface {
    events = new EventEmitter()
    rootSize = {
        width: 1920,
        height: 1080,
    }

    processRootResize() {}
}

export function createServices(): UIServices {
    return {
        device: new MockDeviceService(),
        overlay: new OverlayService(),
        logicRegistry: new LogicRegistryService(),
        clipboard: {
            copy: async (text) => {
                await copyToClipboard(text)
            },
        },
    }
}
