export const generateUniqueAnnotationUrl = (params: {
    pageUrl: string
    now: () => number
}) => {
    const { pageUrl, now } = params
    return `${pageUrl}/#${now()}`
}
