import { Annotation } from './types/api'

export type AnnotationClickHandler = (params: {
    unifiedAnnotationId: string
    openInEdit?: boolean
    annotation?: Annotation
}) => void
