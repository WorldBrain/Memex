import { ContentScriptRegistry } from './types'

export async function main() {}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerRibbonScript(main)
