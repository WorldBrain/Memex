export const createTestTagRecords = (args: {
    numOfTags: number
    pagesPerTag: number
    annotsPerPage: number
}): Array<{ name: string; url: string }> => {
    const tagNames = [...Array(args.numOfTags).keys()].map(String)

    return [...Array(args.pagesPerTag).keys()].flatMap((pageNumber) => {
        const normalizedPageUrl = 'test.com/' + pageNumber
        return [
            ...tagNames.map((tagName) => ({
                name: tagName,
                url: normalizedPageUrl,
            })),
            ...createAnnotsForPage(
                normalizedPageUrl,
                args.annotsPerPage,
            ).flatMap((annotUrl) =>
                tagNames.map((tagName) => ({
                    name: tagName,
                    url: annotUrl,
                })),
            ),
        ]
    })
}

const createAnnotsForPage = (normalizedPageUrl: string, numOfAnnots: number) =>
    [...Array(numOfAnnots).keys()].map(
        (i) => `${normalizedPageUrl}#${Date.now() + i}`,
    )
