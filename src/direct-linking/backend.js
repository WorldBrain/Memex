const BACKEND_ORIGIN = `http://dyn.${process.env.NODE_ENV !== 'production'
    ? 'staging.'
    : ''}memex.link`

export async function createAnnotationLink({ url, anchor }) {
    const data = {
        annotation: {
            url,
            anchors: [anchor],
        },
    }
    const response = await fetch(BACKEND_ORIGIN, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        redirect: 'error',
        body: JSON.stringify(data),
    })
    const json = await response.json()

    return { url: json.link }

    // return await new Promise((resolve, reject) => {
    //     setTimeout(() => resolve({url: 'http://memex.link/aefdawfe/memex.link/demo'}), 2000)
    // })
}
