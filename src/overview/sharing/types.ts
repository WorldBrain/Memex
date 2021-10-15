import type { TaskState } from 'ui-logic-core/lib/types'

import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'

interface PostShareChanges {
    isShared: boolean
    isProtected?: boolean
}

export interface ShareMenuCommonProps {
    contentSharingBG: ContentSharingInterface
    annotationsBG: AnnotationInterface<'caller'>
    closeShareMenu: React.MouseEventHandler
    copyLink: (link: string) => Promise<void>
    postShareHook?: (changes: PostShareChanges) => void
}

export interface ShareMenuCommonState {
    link: string
    loadState: TaskState
    shareState: TaskState
}
