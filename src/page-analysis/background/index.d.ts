export type PageAnalyzer = (
    {
        tabId,
        allowContent = true,
        allowScreenshot = true,
        allowFavIcon = true,
    }: {
        tabId: number
        allowContent?: boolean
        allowScreenshot?: boolean
        allowFavIcon?: boolean
    },
) => Promise<{
    favIconURI: string
    screenshotURI: string
    content: any
}>

const analyzePage: PageAnalyzer

export default analyzePage
