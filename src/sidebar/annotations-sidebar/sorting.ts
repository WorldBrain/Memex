import { Annotation } from 'src/annotations/types'
import { getAnchorSelector } from 'src/highlighting/utils'

type SortableAnnotation = Pick<Annotation, 'selector' | 'createdWhen'>

export type AnnotationsSorter = (
    a: SortableAnnotation,
    b: SortableAnnotation,
) => number

export const sortByPagePosition: AnnotationsSorter = (a, b) => {
    if (!a.selector && !b.selector) {
        return 0
    }
    if (!a.selector) {
        return -100000
    }
    if (!b.selector) {
        return 100000
    }

    return (
        getAnchorSelector(a.selector, 'TextPositionSelector').start -
        getAnchorSelector(b.selector, 'TextPositionSelector').start
    )
}

export const sortByCreatedTime: AnnotationsSorter = (a, b) =>
    new Date(a.createdWhen).getTime() - new Date(b.createdWhen).getTime()
