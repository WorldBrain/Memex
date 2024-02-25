import { Runtime, Storage } from 'webextension-polyfill'
import { indexRSSfeed } from './utils'
import { PkmSyncInterface } from 'src/pkm-integrations/background/types'

export function injectSubstackButtons(
    pkmSyncBG: PkmSyncInterface,
    storageAPI: Storage.Static,
    openSidebarInRabbitHole: () => void,
    runtimeAPI: Runtime.Static,
) {
    const existingMemexButtons = document.getElementById('memexButtons')
    if (existingMemexButtons) {
        existingMemexButtons.remove()
    }
    const url = new URL(window.location.href)
    const feedUrl = `${url.protocol}//${url.hostname}/feed`

    const feedSources = [
        {
            feedUrl,
            type: 'substack', // giving this metadata bc this page under the hood is a substack page, and that is processed in a different way
        },
    ]

    const NavBarButtons = document.getElementsByClassName('navbar-buttons')
    const memexButtons = document.createElement('div')
    memexButtons.id = 'memexButtons'
    memexButtons.style.display = 'flex'
    memexButtons.style.alignItems = 'center'
    memexButtons.style.height = 'fill-available'
    memexButtons.style.padding = '00 15px 0 15px'

    memexButtons.style.borderRadius = '6px'
    memexButtons.style.border = '1px solid #3E3F47'
    memexButtons.style.overflow = 'hidden'
    memexButtons.style.overflowX = 'scroll'
    memexButtons.style.backgroundColor = '#12131B'
    memexButtons.style.color = '#FAFAFA'
    memexButtons.style.fontSize = '14px'
    memexButtons.style.gap = '10px'
    memexButtons.style.cursor = 'pointer'
    memexButtons.innerText = 'Follow with Memex'
    memexButtons.style.overflow = 'hidden'
    memexButtons.onclick = async () => {
        const rabbitHoleEnabled = await storageAPI.local.get(
            'rabbitHoleBetaFeatureAccessOnboardingDone',
        )

        if (!rabbitHoleEnabled.rabbitHoleBetaFeatureAccessOnboardingDone) {
            openSidebarInRabbitHole()
        } else {
            memexButtons.onclick = () => {}
            memexButtons.innerText = 'Followed!'
            const indexFeed = await indexRSSfeed(feedSources, pkmSyncBG)

            if (indexFeed === 'error') {
                memexButtons.innerText = 'Error following feed'
            }
        }
    }

    // MemexIconDisplay
    const memexIcon = runtimeAPI.getURL('/img/memex-icon.svg')
    const memexIconEl = document.createElement('img')
    memexIconEl.src = memexIcon
    memexButtons.appendChild(memexIconEl)
    memexIconEl.style.height = '20px'

    NavBarButtons[0].insertBefore(memexButtons, NavBarButtons[0].firstChild)
}
