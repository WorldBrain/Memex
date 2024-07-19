import type { Tabs, ContextMenus, Browser } from 'webextension-polyfill'
import { bindMethod } from 'src/util/functions'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIInterface } from './types'
import { InPageUIContentScriptRemoteInterface } from '../content_script/types'
// import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { OVERVIEW_URL } from 'src/constants'
import { checkStripePlan } from '@worldbrain/memex-common/lib/subscriptions/storage'

import { blobToDataURL } from 'src/util/blob-utils'
import { pipeline, env } from '@xenova/transformers'
// import * as ort from 'onnxruntime-web'

export const CONTEXT_MENU_ID_PREFIX = '@memexContextMenu:'
export const CONTEXT_MENU_HIGHLIGHT_ID =
    CONTEXT_MENU_ID_PREFIX + 'createHighlight'
export const CONTEXT_MENU_SAVE_IMAGE_ID = CONTEXT_MENU_ID_PREFIX + 'saveImage'
export const CONTEXT_MENU_ANALYSE_IMAGE_ID =
    CONTEXT_MENU_ID_PREFIX + 'analyseImage'

export interface Props {
    tabsAPI: Tabs.Static
    contextMenuAPI: ContextMenus.Static
    browserAPIs: Browser
    fetch: typeof fetch
}

export class InPageUIBackground {
    remoteFunctions: InPageUIInterface<'provider'>

    constructor(private options: Props) {
        this.remoteFunctions = {
            showSidebar: bindMethod(this, 'showSidebar'),
            openDashboard: bindMethod(this, 'openDashboard'),
            getCurrentTabURL: bindMethod(this, 'getCurrentTabURL'),
            transcribeAudioUrl: bindMethod(this, 'transcribeAudioUrl'),
            checkStripePlan: bindMethod(this, 'checkStripePlan'),
            updateContextMenuEntries: bindMethod(
                this,
                'updateContextMenuEntries',
            ),
        }

        this.setupContextMenuEntries()
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    private async getHighlightContextMenuTitle(): Promise<string> {
        // TODO mv3: figure out why BG Service Worker crashes when this fn's invoked (or find another way to get same shortcut data)
        // const {
        //     shortcutsEnabled,
        //     createHighlight,
        // } = await getKeyboardShortcutsState()
        const baseTitle = 'Highlight with Memex'
        return baseTitle

        // if (!createHighlight.shortcut.length) {
        //     return baseTitle
        // } else if (!shortcutsEnabled || !createHighlight.enabled) {
        //     return `${baseTitle} -- ${createHighlight.shortcut} (disabled)`
        // }

        // return `${baseTitle} (${createHighlight.shortcut})`
    }

    setupContextMenuEntries() {
        this.options.contextMenuAPI.create({
            id: CONTEXT_MENU_HIGHLIGHT_ID,
            title: 'Highlight with Memex',
            contexts: ['selection'],
        })

        this.options.contextMenuAPI.onClicked.addListener(
            async ({ menuItemId, srcUrl }, tab) => {
                if (menuItemId === CONTEXT_MENU_HIGHLIGHT_ID) {
                    return this.createHighlightInTab(tab.id)
                }
                if (menuItemId === CONTEXT_MENU_SAVE_IMAGE_ID && srcUrl) {
                    const imageBlob = await this.options
                        .fetch(srcUrl)
                        .then((res) => res.blob())
                    const imageDataUrl = await blobToDataURL(imageBlob)
                    await this.saveImageAsNewNote(tab.id, imageDataUrl)
                }
                if (menuItemId === CONTEXT_MENU_ANALYSE_IMAGE_ID && srcUrl) {
                    const imageBlob = await this.options
                        .fetch(srcUrl)
                        .then((res) => res.blob())
                    const imageDataUrl = await blobToDataURL(imageBlob)
                    await this.analyseImageAsWithAI(tab.id, imageDataUrl)
                }
            },
        )
        this.options.contextMenuAPI.create({
            id: CONTEXT_MENU_SAVE_IMAGE_ID,
            title: 'Save with Memex',
            contexts: ['image'],
        })
        this.options.contextMenuAPI.create({
            id: CONTEXT_MENU_ANALYSE_IMAGE_ID,
            title: 'Analyse with AI',
            contexts: ['image'],
        })
    }

    async updateContextMenuEntries() {
        await this.options.contextMenuAPI.update(CONTEXT_MENU_HIGHLIGHT_ID, {
            title: await this.getHighlightContextMenuTitle(),
        })
    }

    async openDashboard() {
        await this.options.tabsAPI.create({ url: OVERVIEW_URL })
    }
    async checkStripePlan(email: string) {
        await checkStripePlan(email, this.options.browserAPIs)
    }
    async transcribeAudioUrl(url2: string) {
        console.log('url', url2)

        // Create a video element
        const video = document.createElement('video')
        video.src = url2
        video.crossOrigin = 'anonymous' // Ensure CORS is handled

        // Initialize the audio context
        const audioContext = new window.AudioContext()
        const mediaSource = audioContext.createMediaElementSource(video)
        const analyser = audioContext.createAnalyser()
        mediaSource.connect(analyser)
        analyser.connect(audioContext.destination)

        // Play the video to start processing the audio
        video.play()

        // Function to get sound data
        function getSoundData() {
            const sample = new Float32Array(analyser.frequencyBinCount)
            analyser.getFloatFrequencyData(sample)
            return sample
        }

        // Example usage: log sound data after a delay
        setTimeout(() => {
            const soundData = getSoundData()
            console.log('Sound Data:', soundData)
        }, 5000) // Adjust the delay as needed
    }

    async getCurrentTabURL() {
        const tabs = await this.options.tabsAPI.query({
            active: true,
            currentWindow: true,
        })
        if (tabs.length > 0) {
            return tabs[0].url // This returns the URL of the current active tab
        }
        return null // Return null or an appropriate value if no active tab is found
    }

    async showSidebar() {
        const currentTab = (
            await this.options.tabsAPI.query({
                active: true,
                currentWindow: true,
            })
        )[0]
        runInTab<InPageUIContentScriptRemoteInterface>(
            currentTab.id,
        ).showSidebar()
    }

    private createHighlightInTab = (tabId: number) =>
        runInTab<InPageUIContentScriptRemoteInterface>(tabId).createHighlight(
            false,
            null,
        )

    private saveImageAsNewNote = (tabId: number, imageData: string) =>
        runInTab<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).saveImageAsNewNote(imageData)

    private analyseImageAsWithAI = (tabId: number, imageData: string) =>
        runInTab<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).analyseImageAsWithAI(imageData)
}

class PipelineSingleton {
    static task = 'text-classification'
    static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    // static task: any = 'automatic-speech-recognition' //'text-classification';
    // static model_name_or_path = 'onnx-community/whisper-base_timestamped' //'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    static quantized = true
    static instance = null
    static model_buffer = null
    static tokenizer = null

    static initializeEnv() {
        env.allowLocalModels = false //this is a must and if it's true by default for the first time, wrong data is cached to keep failing after this line is added, until the cache is cleared in browser!
        // Due to a bug in onnxruntime-web, we must disable multithreading for now.
        // See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
        env.backends.onnx.wasm.numThreads = 1
    }

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.initializeEnv()
            console.log('pipeline')
            this.instance = pipeline(this.task, this.model_name_or_path, {
                quantized: this.quantized,
                progress_callback /*more options: https://huggingface.co/docs/transformers.js/api/utils/hub#module_utils/hub..PretrainedOptions*/,
            })
        }

        return this.instance
    }
}
