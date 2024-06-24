import * as constants from '../../search-injection/constants'
import * as utils from '../../search-injection/utils'
import { handleRenderSearchInjection } from '../../search-injection/searchInjection'
import { handleRenderYoutubeInterface } from '../../search-injection/youtubeInterface'
import { renderErrorDisplay } from '../../search-injection/error-display'
import { renderSearchDisplay } from '../../search-injection/search-display'
import type { ContentScriptRegistry, InPageUIInjectionsMain } from './types'
import { renderUpgradeModal } from 'src/search-injection/upgrade-modal-display'
import { handleRenderPDFOpenButton } from 'src/search-injection/pdf-open-button'
import { handleRenderImgActionButtons } from 'src/search-injection/img-action-buttons'

export const main: InPageUIInjectionsMain = async ({
    inPageUI,
    annotationsFunctions,
    searchDisplayProps,
    upgradeModalProps,
    syncSettings,
    syncSettingsBG,
}) => {
    inPageUI.events.on(
        'injectOnDemandInPageUI',
        async ({ component, options }) => {
            if (component === 'error-display') {
                if (options?.errorDisplayProps) {
                    renderErrorDisplay(options.errorDisplayProps)
                }
            } else if (component === 'upgrade-modal') {
                renderUpgradeModal({
                    ...upgradeModalProps,
                    ...options.powerUpModalProps,
                })
            } else if (component === 'dashboard') {
                renderSearchDisplay(searchDisplayProps)
            } else if (component === 'youtube-integration') {
                const url = window.location.href
                if (url.includes('youtube.com')) {
                    await handleRenderYoutubeInterface(
                        syncSettings,
                        syncSettingsBG,
                        annotationsFunctions,
                        upgradeModalProps.browserAPIs,
                    )
                }
            } else if (component === 'pdf-open-button') {
                await handleRenderPDFOpenButton(
                    syncSettings,
                    syncSettingsBG,
                    annotationsFunctions,
                    upgradeModalProps.browserAPIs,
                    options.embedElements,
                    options.contentScriptsBG,
                )
            } else if (component === 'img-action-buttons') {
                await handleRenderImgActionButtons(
                    syncSettings,
                    annotationsFunctions,
                    upgradeModalProps.browserAPIs,
                    options.imageElements,
                    options.contentScriptsBG,
                )
            } else if (component === 'search-engine-integration') {
                const url = window.location.href
                const matched = utils.matchURL(url)

                if (matched) {
                    const searchInjection =
                        (await syncSettings.searchInjection.get(
                            'searchEnginesEnabled',
                        )) ?? constants.SEARCH_INJECTION_DEFAULT
                    if (searchInjection[matched]) {
                        try {
                            const query = utils.fetchQuery(url)

                            await handleRenderSearchInjection(
                                query,
                                searchDisplayProps.searchBG.unifiedSearch,
                                matched,
                                syncSettings,
                                () =>
                                    searchDisplayProps.bgScriptBG.openOptionsTab(
                                        {
                                            query: 'settings',
                                        },
                                    ),
                                searchDisplayProps.searchBG,
                                searchDisplayProps.openPDFinViewer,
                            )
                        } catch (err) {
                            console.error(err)
                        }
                    }
                }
            }
        },
    )
}

const registry = globalThis['contentScriptRegistry'] as ContentScriptRegistry
registry.registerInPageUIInjectionScript(main)
