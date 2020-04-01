import { ContentScriptRegistry } from './types'
import { Ribbon } from 'src/in-page-ui/ribbon'

export async function main() {
    const ribbon = new Ribbon()
    return { ribbonController: ribbon }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerRibbonScript(main)
