export type PageAnalyzer = ({
    tabId,
    allowContent = true,
    allowScreenshot = true,
    allowFavIcon = true,
}: {
    tabId: number
    allowContent?: boolean
    allowScreenshot?: boolean
    allowFavIcon?: boolean
}) => {
    favIconURI: string
    screenshotURI: string
    content: any
}

const analyzePage: PageAnalyzer

export default analyzePage
