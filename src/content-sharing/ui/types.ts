import { TaskState } from 'ui-logic-core/lib/types'

export interface AnnotationSharingInfo {
    status: 'not-yet-shared' | 'shared' | 'unshared'
    taskState: TaskState
}
export type AnnotationSharingAccess =
    | 'feature-disabled'
    | 'page-not-shared'
    | 'sharing-allowed'
