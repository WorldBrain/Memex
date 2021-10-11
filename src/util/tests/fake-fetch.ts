export class FakeFetch {
    capturedReqs: Array<[RequestInfo, RequestInit | undefined]> = []
    fetch: typeof fetch = async (input, init) => {
        this.capturedReqs.push([input, init])
        return { status: 200 } as Response
    }
}
