import type { TaskState } from 'ui-logic-core/ts/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/ts/annotations/types'

export interface AnnotationSharingInfo {
    status: 'not-yet-shared' | 'shared' | 'unshared'
    taskState: TaskState
    privacyLevel: AnnotationPrivacyLevels
}
export type AnnotationSharingAccess = 'feature-disabled' | 'sharing-allowed'
