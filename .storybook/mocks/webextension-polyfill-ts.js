// Update this to include mocks for different WebExt APIs
export const browser = {
    tabs: {},
    storage: {
        local: {
            get(a) {
                return Promise.resolve({})
            },
            set(a, b) {
                return Promise.resolve()
            },
        },
    },
    extension: {
        getURL(a) {
            return Promise.resolve(undefined)
        },
    },
    runtime: {
        onMessage(a) {
            return Promise.resolve()
        },
        sendMessage(a) {
            return Promise.resolve()
        },
        getURL(a) {
            return Promise.resolve(undefined)
        },
        getManifest(a) {
            return Promise.resolve({ version: 1 })
        },
    },
}
