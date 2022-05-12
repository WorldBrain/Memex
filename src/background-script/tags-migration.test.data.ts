export const TAG_NAME_PREFIX = 'test tag '
export const PAGE_URL_PREFIX = 'test.com/'
export const PDF_PAGE_URL_PREFIX = 'memex.cloud/ct/'

export const createTestTagRecords = (args: {
    numOfTags: number
    pagesPerTag: number
    annotsPerPage: number
}): Array<{ name: string; url: string }> => {
    const tagNames = [...Array(args.numOfTags).keys()].map(
        (i) => TAG_NAME_PREFIX + i,
    )

    return [...Array(args.pagesPerTag).keys()].flatMap((pageNumber) => {
        const normalizedPageUrl =
            pageNumber % 2 === 0
                ? PAGE_URL_PREFIX + pageNumber
                : PDF_PAGE_URL_PREFIX + pageNumber + '.pdf'
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
        (i) => `${normalizedPageUrl}/#${Date.now() + i}`,
    )
