import { TaskState } from 'ui-logic-core/lib/types'

import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'

interface PostShareChanges {
    privacyLevel?: AnnotationPrivacyLevels
    shareStateChanged: boolean
}

export interface ShareMenuCommonProps {
    contentSharingBG?: ContentSharingInterface
    annotationsBG?: AnnotationInterface<'caller'>
    closeShareMenu: React.MouseEventHandler
    copyLink: (link: string) => Promise<void>
    postShareHook?: (changes: PostShareChanges) => void
    postUnshareHook?: (changes: PostShareChanges) => void
}

export interface ShareMenuCommonState {
    link: string
    loadState: TaskState
    shareState: TaskState
}
