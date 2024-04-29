import * as Global from './global'
import { runInBackground } from 'src/util/webextensionRPC'
import { ContentScriptsInterface } from '../background/types'

const contentScriptsBG = runInBackground<ContentScriptsInterface<'caller'>>()

// auto-reload the old memex.garden homepage that had caching issues

if (window.location.href.includes('memex.garden')) {
    let maxTries = 20
    let tries = 0

    let checkCondition = async function () {
        if (tries >= maxTries) {
            clearInterval(checkInterval)
            return
        }
        if (document.getElementById('___gatsby')) {
            await contentScriptsBG.reloadTab({ bypassCache: true })
            // Clear the interval once the condition is met to stop further checking.
            clearInterval(checkInterval)
            return
        }

        if (document.getElementById('main')) {
            clearInterval(checkInterval)
        }
        tries++
    }

    // Execute immediately for the first time
    setTimeout(checkCondition, 0)

    // Start interval after the first immediate check
    let checkInterval = setInterval(checkCondition, 50)
}

// load regular content script global file
Global.main()
