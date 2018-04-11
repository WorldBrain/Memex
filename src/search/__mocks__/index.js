export const indexQueue = {
    clear() {},
}

export async function grabExistingKeys() {
    return {
        histKeys: new Set(),
        bmKeys: new Set(),
    }
}
