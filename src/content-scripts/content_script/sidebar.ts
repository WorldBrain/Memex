import { ContentScriptRegistry, SidebarScriptMain } from './types'
import { Sidebar } from 'src/in-page-ui/sidebar'
import { browser } from 'webextension-polyfill-ts'
import { createInPageUI } from 'src/in-page-ui/utils'
import { setupSidebarUI } from 'src/in-page-ui/sidebar/react'

export const main: SidebarScriptMain = async dependencies => {
    const cssFile = browser.extension.getURL(`/content_script_ribbon.css`)
    const sidebar = new Sidebar({
        createUI: () => {
            createInPageUI('ribbon', cssFile, element => {
                setupSidebarUI(element, {
                    sidebarEvents: sidebar.events,
                })
            })
        },
    })
    return { sidebarController: sidebar }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerSidebarScript(main)
