import type { UnifiedList } from 'src/annotations/cache/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'

export async function findClassElementSWithRetries(className, retries, delay) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const element = document.getElementsByClassName(className)
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

export function renderSpacesBar(
    lists: UnifiedList[],
    bgScriptBG: RemoteBGScriptInterface<'caller'>,
    url?: string,
) {
    let spacesBar: HTMLElement

    if (url) {
        spacesBar = document.getElementById(`spacesBar_${url}`)
    } else {
        spacesBar = document.getElementById(`spacesBar`)
    }

    if (!spacesBar) {
        spacesBar = document.createElement('div')
    } else {
        spacesBar.innerHTML = ''
    }

    if (lists.length > 0) {
        spacesBar.id = url ? `spacesBar_${url}` : `spacesBar`
        spacesBar.style.display = 'flex'
        spacesBar.style.alignItems = 'center'
        spacesBar.style.gap = '5px'
        spacesBar.style.flexWrap = 'wrap'
    } else {
        spacesBar.id = url ? `spacesBar_${url}` : `spacesBar`
        spacesBar.style.display = 'flex'
        spacesBar.style.alignItems = 'center'
        spacesBar.style.gap = '0px'
        spacesBar.style.marginTop = '0px'
    }

    lists.forEach((list) => {
        const listDiv = document.createElement('div')
        listDiv.style.background = '#C6F0D4'
        listDiv.style.padding = '3px 10px'
        listDiv.style.marginTop = '5px'
        listDiv.style.borderRadius = '5px'
        listDiv.style.cursor = 'pointer'
        listDiv.style.color = '#12131B'
        listDiv.style.fontSize = '14px'
        listDiv.style.display = 'flex'
        listDiv.style.alignItems = 'center'
        listDiv.style.fontFamily = 'Arial'
        listDiv.innerText = list.name // assuming 'name' is a property of the list items
        listDiv.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            bgScriptBG.openOverviewTab({
                // TODO: fix type but list.localId is not working. Tetst by clicking on the pills in telegram/twitter. They should jump to the right space in the dashboard
                /** @ts-ignore */
                selectedSpace: list.listId || list.localId,
            })
        })
        spacesBar.appendChild(listDiv)
    })

    return spacesBar
}

export async function indexRSSfeed(feedSources, pkmSyncBG) {
    try {
        try {
            return await pkmSyncBG.addFeedSources(feedSources)
        } catch (e) {
            console.log('error', e)
            return 'error'
        }
    } catch (error) {
        console.error('Error:', error)
    }
}
