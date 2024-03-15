import { SidebarTab } from 'src/sidebar/annotations-sidebar/containers/types'

export interface PageSummaryBackgroundEvents {
    startSummaryStream(): void
    newSummaryToken(event: { token: string }): void
    newSummaryTokenEditor(event: { token: string }): void
    newChapterSummaryToken(event: {
        token: string
        chapterSummaryIndex: number
    }): void
    setActiveSidebarTab(event: { activeTab: SidebarTab }): void
}
