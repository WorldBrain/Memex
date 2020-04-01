import { ContentScriptRegistry } from './types'
import { Sidebar } from 'src/in-page-ui/sidebar'
import { browser } from 'webextension-polyfill-ts'

export async function main() {
    const cssFile = browser.extension.getURL(`/content_script_ribbon.css`)
    const sidebar = new Sidebar({ cssFile })
    return { sidebarController: sidebar }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerSidebarScript(main)
