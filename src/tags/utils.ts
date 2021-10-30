export async function updateSuggestionsCache(args: {
    added?: string
    removed?: string
    updated?: [string, string]
    suggestionLimit?: number
    getCache(): Promise<string[]>
    setCache(suggestions: string[]): Promise<void>
}) {
    let suggestions = await args.getCache()

    if (args.added) {
        const index = suggestions.indexOf(args.added)
        if (index !== -1) {
            delete suggestions[index]
            suggestions = suggestions.filter(Boolean)
        }
        suggestions.unshift(args.added)
    }

    if (args.updated) {
        const [oldName, newName] = args.updated
        const i = suggestions.indexOf(oldName)

        if (i !== -1) {
            suggestions[i] = newName
        }
    }

    if (args.removed) {
        const index = suggestions.indexOf(args.removed)
        delete suggestions[index]
        suggestions = suggestions.filter(Boolean)
    }

    if (args.suggestionLimit) {
        suggestions = suggestions.slice(0, args.suggestionLimit)
    }

    await args.setCache(suggestions)
}
