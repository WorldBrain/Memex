import { TaskState } from 'ui-logic-core/lib/types'
import { AnnotationPrivacyLevels } from 'src/annotations/types'

export interface AnnotationSharingInfo {
    status: 'not-yet-shared' | 'shared' | 'unshared'
    taskState: TaskState
    privacyLevel: AnnotationPrivacyLevels
}
export type AnnotationSharingAccess = 'feature-disabled' | 'sharing-allowed'
