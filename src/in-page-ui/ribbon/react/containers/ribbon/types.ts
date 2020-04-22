import { HighlightInteractionInterface } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'

export interface RibbonContainerDependencies {
    currentTab: { id: number }
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: Pick<HighlightInteractionInterface, 'removeHighlights'>
    annotationsManager: AnnotationsManager
}
