export type TabEventChecker = ({ tabId }: { tabId: number }) => Promise<void>

export const whenPageDOMLoaded: TabEventChecker
export const whenPageLoadComplete: TabEventChecker
export const whenTabActive: TabEventChecker
export const whenTabTitleUpdates: TabEventChecker
