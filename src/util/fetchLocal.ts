export const isLocalUrl = (url) => /^file:\/\/.+$/.test(url)

export default function fetchLocalOrRemote(url, opts = {}): Promise<Response> {
    return isLocalUrl(url) ? fetchLocal(url) : fetch(url, opts)
}

export const fetchLocal = (url): Promise<Response> => {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest()
        xhr.onload = function () {
            resolve(new Response(xhr.response, { status: 200 }))
        }
        xhr.onerror = function () {
            reject(new TypeError('Local request failed'))
        }
        xhr.open('GET', url)
        xhr.responseType = 'arraybuffer'
        xhr.send(null)
    })
}
