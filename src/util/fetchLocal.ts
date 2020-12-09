const isLocal = (url) => /^file:\/\/.+$/.test(url)
export default function fetchLocalOrRemote(url): Promise<Response> {
    if (!isLocal(url)) {
        return fetch(url)
    }

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
