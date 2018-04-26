export default {
    queue: {
        clear: () => false,
    },

    grabExistingKeys: () => ({
        histKeys: new Set(),
        bmKeys: new Set(),
    }),
}
