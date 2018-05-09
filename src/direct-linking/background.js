browser.webRequest.onBeforeRequest.addListener(
    ({ url }) => {
        const result = /https?:\/\/(?:staging\.)?memex.link\/([^/]+)\/(.+)$/.exec(
            url,
        )
        const linkID = result[1]
        const targetUrl = 'http://' + result[2]
        return { redirectUrl: targetUrl }
    },
    { urls: ['*://memex.link/*', '*://staging.memex.link/*'] },
    ['blocking'],
)
