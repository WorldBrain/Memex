import { runtime } from 'webextension-polyfill'
import { indexRSSfeed } from './utils'

export function injectSubstackButtons(pkmSyncBG) {
    const existingMemexButtons = document.getElementById('memexButtons')
    if (existingMemexButtons) {
        existingMemexButtons.remove()
    }
    const url = new URL(window.location.href)
    const feedUrl = `${url.protocol}//${url.hostname}`

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
    memexButtons.onclick = async () => {
        memexButtons.innerText = 'Followed!'
        await indexRSSfeed(feedUrl, pkmSyncBG, true)
    }

    // MemexIconDisplay
    const memexIcon = runtime.getURL('/img/memex-icon.svg')
    const memexIconEl = document.createElement('img')
    memexIconEl.src = memexIcon
    memexButtons.appendChild(memexIconEl)
    memexIconEl.style.height = '20px'

    NavBarButtons[0].insertBefore(memexButtons, NavBarButtons[0].firstChild)
}
