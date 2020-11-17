import { Annotation } from 'src/annotations/types'

export type AnnotationsSorter = (a: Annotation, b: Annotation) => number

// TODO: something is not quite right with this one
export const sortByPagePosition: AnnotationsSorter = (a, b) => {
    if (!a.selector && !b.selector) {
        return 0
    }
    if (!a.selector) {
        return 100000
    }
    if (!b.selector) {
        return -100000
    }

    const getTextPosSelector = (contentTypes = []): { start: number } =>
        contentTypes.find(
            (content) => content.type === 'TextPositionSelector',
        ) ?? { start: 0 }

    return (
        getTextPosSelector(a.selector.descriptor.content).start -
        getTextPosSelector(b.selector.descriptor.content).start
    )
}

export const sortByCreatedTime: AnnotationsSorter = (a, b) =>
    new Date(a.createdWhen).getTime() - new Date(b.createdWhen).getTime()
