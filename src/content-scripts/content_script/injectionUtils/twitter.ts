import type { RemoteBGScriptInterface } from 'src/background-script/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { renderSpacesBar } from './utils'

export async function getActiveTwitterUserName(
    maxRetries,
    delayInMilliseconds,
) {
    const filteredElements = await findElementWithRetries(
        '[aria-selected="true"]',
        maxRetries,
        delayInMilliseconds,
    )

    return filteredElements
}

export async function trackTwitterMessageList(
    collectionsBG: RemoteCollectionsInterface,
    bgScriptBG: RemoteBGScriptInterface<'caller'>,
) {
    const maxRetries = 40
    const delayInMilliseconds = 500

    const tabListDiv = (await findElementWithRetries(
        '[role="tablist"]',
        maxRetries,
        delayInMilliseconds,
    )) as HTMLElement

    if (tabListDiv) {
        // Your main logic encapsulated in a function
        const processNode = async (node) => {
            if (!node?.textContent.includes(`’s message with`)) {
                const userName =
                    node?.textContent.split('@')[1]?.split('·')[0] ?? ''

                if (userName) {
                    let fullUrl = `https://twitter.com/${userName}`

                    let spacesBarContainer = document.createElement('div')
                    spacesBarContainer.id = `spacesBarContainer_${fullUrl}`
                    spacesBarContainer.style.display = 'flex'

                    const pageLists = await fetchListDataForSocialProfiles(
                        collectionsBG,
                        fullUrl,
                    )

                    if (pageLists != null && pageLists.length > 0) {
                        const spacesBar = renderSpacesBar(
                            pageLists,
                            bgScriptBG,
                            fullUrl,
                        ) as HTMLElement
                        spacesBar.style.flexWrap = 'wrap'
                        spacesBarContainer.style.marginTop = '5px'
                        spacesBarContainer.appendChild(spacesBar)
                    }
                    let element = node as HTMLElement
                    let conversationElement = element.querySelector(
                        '[data-testid="conversation"]',
                    ) as HTMLElement

                    if (conversationElement) {
                        conversationElement.insertAdjacentElement(
                            'beforeend',
                            spacesBarContainer,
                        )
                    }
                }
            }
        }

        // Initial processing
        tabListDiv.childNodes.forEach((node) => processNode(node))

        // Mutation Observer
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            processNode(node)
                        }
                    })
                }
            }
        })

        observer.observe(tabListDiv, { childList: true })
    }
}

export async function injectTwitterProfileUI(
    collectionsBG: RemoteCollectionsInterface,
    bgScriptBG: RemoteBGScriptInterface<'caller'>,
    url: string,
) {
    const maxRetries = 40
    const delayInMilliseconds = 500 // adjust this based on your needs
    let pageType: string

    try {
        let userNameBox: HTMLElement
        const selector = '[data-testid="UserDescription"]'
        userNameBox = (await findElementWithRetries(
            selector,
            maxRetries,
            delayInMilliseconds,
        )) as HTMLElement

        if (userNameBox != null) {
            let spacesBar: HTMLElement
            let spacesBarContainer = document.createElement('div')
            spacesBarContainer.id = `spacesBarContainer_${url}`
            spacesBarContainer.style.marginTop = '5px'

            userNameBox.insertAdjacentElement('beforeend', spacesBarContainer)

            const pageLists = await fetchListDataForSocialProfiles(
                collectionsBG,
                url,
            )

            if (pageLists != null && pageLists.length > 0) {
                spacesBar = renderSpacesBar(pageLists, bgScriptBG, url)
                spacesBarContainer.appendChild(spacesBar)
                userNameBox.style.marginBottom = '10px'
            } else {
                return
            }
        }
    } catch (error) {
        console.error(error.message)
    }
    return
}

async function fetchListDataForSocialProfiles(collectionsBG, fullUrl: string) {
    const lists = await collectionsBG.fetchPageListEntriesByUrl({
        url: fullUrl,
    })
    if (lists.length > 0) {
        const updatedLists = await Promise.all(
            lists
                .filter((list) => list.listId !== 20201014)
                .map(async (list) => {
                    const listData = await collectionsBG.fetchListById({
                        id: list.listId,
                    })
                    ;(list as any).name = listData.name // Add the list name to the original list object.
                    return list
                }),
        )
        return updatedLists
    }
}

async function findElementWithRetries(selector, retries, delay) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const element = document.querySelector(selector)

            if (element) {
                resolve(element)
            } else if (retries > 0) {
                setTimeout(() => {
                    retries--
                    attempt()
                }, delay)
            } else {
                reject(new Error('Element not found after maximum retries.'))
            }
        }

        attempt()
    })
}
