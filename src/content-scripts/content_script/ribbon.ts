import { browser } from 'webextension-polyfill-ts'
import { ContentScriptRegistry } from './types'
import { Ribbon } from 'src/in-page-ui/ribbon'
import { setupRibbonUI } from 'src/in-page-ui/ribbon/react'
import { createInPageUI } from 'src/in-page-ui/utils'

export async function main() {
    const cssFile = browser.extension.getURL(`/content_script_ribbon.css`)
    const ribbon = new Ribbon({
        createUI: () => {
            createInPageUI('ribbon', cssFile, element => {
                setupRibbonUI(element, {
                    ribbonEvents: ribbon.events,
                })
            })
        },
    })
    return { ribbonController: ribbon }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerRibbonScript(main)
