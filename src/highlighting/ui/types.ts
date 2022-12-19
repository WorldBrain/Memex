import { Annotation } from './types/api'

export type AnnotationClickHandler = (params: {
    annotationUrl: string
    openInEdit?: boolean
    annotation?: Annotation
}) => void
