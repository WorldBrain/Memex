async function NewSearchTriggered() {
    const currentCachedNoOfSearches = localStorage.getItem('cachedNoOfSearches')
    if (currentCachedNoOfSearches === null) {
        localStorage.setItem('cachedNoOfSearches', 1)
    } else {
        UpdateNoOfSearches(parseInt(currentCachedNoOfSearches) + 1)
    }
}

async function UpdateNoOfSearches(cachedNoOfSearches) {
    localStorage.setItem('cachedNoOfSearches', cachedNoOfSearches)
}

export default NewSearchTriggered
