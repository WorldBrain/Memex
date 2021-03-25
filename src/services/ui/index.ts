import LogicRegistryService from '@worldbrain/memex-common/lib/services/logic-registry'
import OverlayService from '@worldbrain/memex-common/lib/services/overlay'

import type { UIServices } from './types'

export async function createServices(): Promise<UIServices> {
    return {
        overlay: new OverlayService(),
        logicRegistry: new LogicRegistryService(),
    }
}
