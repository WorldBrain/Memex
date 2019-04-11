export const loadBlob = ({
    url,
    timeout,
    responseType,
}: {
    url: string
    timeout: number
    responseType?: any
}) => {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest()
        req.timeout = timeout
        req.responseType = responseType
        req.open('GET', url, true)
        req.onload = () => resolve(req.response)
        req.onerror = () => reject(req.statusText)
        req.send()
    })
}
