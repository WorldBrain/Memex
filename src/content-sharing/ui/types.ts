import type { TaskState } from 'ui-logic-core/lib/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export interface AnnotationSharingInfo {
    status: 'not-yet-shared' | 'shared' | 'unshared'
    taskState: TaskState
    privacyLevel: AnnotationPrivacyLevels
}
export type AnnotationSharingAccess = 'feature-disabled' | 'sharing-allowed'
