import { Annotation, AnnotationsManagerInterface } from 'src/annotations/types'
import { Result, ResultsByUrl } from 'src/overview/types'
import { PageUrlsByDay } from 'src/search/background/types'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'

export interface SidebarContainerDependencies {
    inPageUI: InPageUIInterface
    annotationsManager: AnnotationsManagerInterface
    currentTab: { id: number; url: string }
    highlighter: Pick<
        HighlightInteractionInterface,
        'removeTempHighlights' | 'removeAnnotationHighlights'
    >

    loadTagSuggestions: () => Promise<string[]>

    loadAnnotations(pageUrl: string): Promise<Annotation[]>
    searchAnnotations(
        query: string,
        pageUrl: string | null,
    ): Promise<{
        results: Result[]
        annotsByDay: PageUrlsByDay
        resultsByUrl: ResultsByUrl
    }>
    searchPages(query: string): Promise<Result[]>

    deleteAnnotation: (annotationUrl: string) => Promise<void>
}
