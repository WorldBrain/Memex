export default class DirectLinkingBackend {
    public dynamicOrigin: string
    public staticOrigin: string

    constructor() {
        this.dynamicOrigin = guessOrigin({ dynamic: true })
        this.staticOrigin = guessOrigin({ dynamic: false })
    }

    async createDirectLink({ url, anchor }) {
        const data = {
            annotation: {
                url,
                anchors: [anchor],
            },
        }
        const response = await fetch(this.dynamicOrigin, {
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

    async fetchAnnotationData({ annotationId }: { annotationId: string }) {
        const response = await fetch(this._buildAnnotationUrl({ annotationId }))
        const data = await response.json()
        return data
    }

    _buildAnnotationUrl({ annotationId }: { annotationId: string }) {
        return `${this.staticOrigin}/${annotationId}/annotation.json`
    }
}

function guessOrigin({ dynamic }: { dynamic: boolean }) {
    const dynamicPrefix = dynamic ? 'dyn.' : ''
    const stagingPrefix = process.env.NODE_ENV !== 'production' ? 'staging.' : ''
    return `http://${dynamicPrefix}${stagingPrefix}memex.link`
}
