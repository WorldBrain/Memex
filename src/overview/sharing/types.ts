import type { TaskState } from 'ui-logic-core/lib/types'

import type {
    AnnotationSharingState,
    AnnotationSharingStates,
    ContentSharingInterface,
} from 'src/content-sharing/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'

interface PostShareChanges {
    isShared: boolean
    isProtected?: boolean
}

export interface ShareMenuCommonProps {
    contentSharingBG: ContentSharingInterface
    annotationsBG: AnnotationInterface<'caller'>
    customListsBG?: RemoteCollectionsInterface
    closeShareMenu: React.MouseEventHandler
    copyLink: (link: string) => Promise<void>
    postBulkShareHook?: (states: AnnotationSharingStates) => void
}

export interface ShareMenuCommonState {
    link: string
    loadState: TaskState
    shareState: TaskState
}
