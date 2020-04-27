import { HighlightInteractionInterface } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'

export interface RibbonContainerDependencies {
    currentTab: { id: number; url: string }
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: Pick<HighlightInteractionInterface, 'removeHighlights'>
    annotationsManager: AnnotationsManager
    setSidebarEnabled: (value: boolean) => Promise<void>
    getSidebarEnabled: () => Promise<boolean>
}
