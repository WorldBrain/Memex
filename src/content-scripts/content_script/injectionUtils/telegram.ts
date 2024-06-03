import type { RemoteBGScriptInterface } from 'src/background-script/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { findClassElementSWithRetries, renderSpacesBar } from './utils'

export async function injectTelegramCustomUI(
    collectionsBG: RemoteCollectionsInterface,
    bgScriptBG: RemoteBGScriptInterface<'caller'>,
    url: string,
) {
    try {
        const textField = document.getElementsByClassName(
            'input-message-input',
        )[0]
        if (textField) {
            textField.classList.add('mousetrap')
        }

        let selector

        selector = '[class="topbar"]'

        const maxRetries = 10
        const delayInMilliseconds = 500 // adjust this based on your needs

        const userNameBox = (
            await findClassElementSWithRetries(
                'topbar',
                maxRetries,
                delayInMilliseconds,
            )
        )[0] as HTMLElement

        if (userNameBox != null) {
            let spacesBar: HTMLElement
            let spacesBarContainer = document.createElement('div')
            spacesBarContainer.id = 'spacesBarContainer'
            spacesBarContainer.style.width = '100%'
            spacesBarContainer.style.zIndex = '3'
            spacesBarContainer.style.height = 'fit-content'
            spacesBarContainer.style.overflow = 'scroll'
            spacesBarContainer.style.padding = '10px 15px 15px 15px'
            spacesBarContainer.style.width = '100%'

            userNameBox.insertAdjacentElement('afterend', spacesBarContainer)

            const pageLists = await fetchListDataForSocialProfiles(
                collectionsBG,
                url,
            )

            if (pageLists != null && pageLists.length > 0) {
                spacesBar = renderSpacesBar(pageLists, bgScriptBG)

                spacesBarContainer.appendChild(spacesBar)
            } else {
                return
            }
        }
    } catch (error) {
        console.error(error.message)
    }
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
