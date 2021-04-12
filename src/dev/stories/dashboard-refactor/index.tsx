import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { storiesOf } from '@storybook/react'
import { ThemeProvider } from 'styled-components'

import { WithDependencies } from '../../utils'
import {
    DashboardContainer,
    Props as DashboardProps,
} from 'src/dashboard-refactor'
import { theme } from 'src/common-ui/components/design-library/theme'
import * as DATA from 'src/dashboard-refactor/logic.test.data'
import {
    StandardSearchResponse,
    AnnotationsSearchResponse,
} from 'src/search/background/types'
import { insertBackgroundFunctionTab } from 'src/tests/ui-logic-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { FakeAnalytics } from 'src/analytics/mock'
import { createServices } from 'src/services/ui'

// TODO: Try to get this working - currently fails due to `browser.runtime.onMessage.addListener` not being defineddddd
async function createDependencies(): Promise<DashboardProps> {
    const { backgroundModules } = await setupBackgroundIntegrationTest()

    return {
        analytics: new FakeAnalytics(),
        copyToClipboard: async (text) => {
            await navigator.clipboard.writeText(text)
            return true
        },
        document,
        location,
        annotationsBG: insertBackgroundFunctionTab(
            backgroundModules.directLinking.remoteFunctions,
        ) as any,
        localStorage: browser.storage.local,
        authBG: backgroundModules.auth.remoteFunctions,
        syncBG: backgroundModules.sync.remoteFunctions,
        tagsBG: backgroundModules.tags.remoteFunctions,
        listsBG: backgroundModules.customLists.remoteFunctions,
        backupBG: insertBackgroundFunctionTab(
            backgroundModules.backupModule.remoteFunctions,
        ) as any,
        searchBG: backgroundModules.search.remoteFunctions.search,
        contentShareBG: backgroundModules.contentSharing.remoteFunctions,
        activityIndicatorBG:
            backgroundModules.activityIndicator.remoteFunctions,
        openFeed: () => undefined,
        openCollectionPage: () => undefined,
        renderDashboardSwitcherLink: () => null,
        renderUpdateNotifBanner: () => null,
        services: createServices(),
    }
}

const stories = storiesOf('Dashboard Refactor|Dashboard', module)

stories.add('Page results 1', () => (
    <DashboardWrapper pageResults={DATA.PAGE_SEARCH_RESULT_1} />
))
stories.add('Page results 2', () => (
    <DashboardWrapper pageResults={DATA.PAGE_SEARCH_RESULT_2} />
))
stories.add('Note results 1', () => (
    <DashboardWrapper noteResults={DATA.ANNOT_SEARCH_RESULT_1} />
))
stories.add('Note results 2', () => (
    <DashboardWrapper noteResults={DATA.ANNOT_SEARCH_RESULT_2} />
))

// stories.add('Page results 1', () => (
//     <WithDependencies setup={createDependencies}>
//         {(deps) => (
//             <DashboardWrapper
//                 pageResults={DATA.PAGE_SEARCH_RESULT_1}
//                 {...deps}
//             />
//         )}
//     </WithDependencies>
// ))
// stories.add('Page results 2', () => (
//     <WithDependencies setup={createDependencies}>
//         {(deps) => (
//             <DashboardWrapper
//                 pageResults={DATA.PAGE_SEARCH_RESULT_2}
//                 {...deps}
//             />
//         )}
//     </WithDependencies>
// ))
// stories.add('Note results 1', () => (
//     <WithDependencies setup={createDependencies}>
//         {(deps) => (
//             <DashboardWrapper
//                 noteResults={DATA.ANNOT_SEARCH_RESULT_1}
//                 {...deps}
//             />
//         )}
//     </WithDependencies>
// ))
// stories.add('Note results 2', () => (
//     <WithDependencies setup={createDependencies}>
//         {(deps) => (
//             <DashboardWrapper
//                 noteResults={DATA.ANNOT_SEARCH_RESULT_2}
//                 {...deps}
//             />
//         )}
//     </WithDependencies>
// ))

// interface WrapperProps extends DashboardProps {
interface WrapperProps {
    pageResults?: StandardSearchResponse
    noteResults?: AnnotationsSearchResponse
}

class DashboardWrapper extends React.PureComponent<WrapperProps> {
    private dashboardRef = React.createRef<DashboardContainer>()

    async componentDidMount() {
        if (this.props.pageResults) {
            await this.dashboardRef.current.processEvent(
                'setPageSearchResult',
                {
                    result: this.props.pageResults,
                },
            )
        } else if (this.props.noteResults) {
            await this.dashboardRef.current.processEvent(
                'setAnnotationSearchResult',
                {
                    result: this.props.noteResults,
                },
            )
        }

        await this.dashboardRef.current.processEvent('setSidebarLocked', {
            isLocked: true,
        })
        await this.dashboardRef.current.processEvent('setLocalListsExpanded', {
            isExpanded: true,
        })
        await this.dashboardRef.current.processEvent('setLocalLists', {
            lists: [
                { id: 1, name: 'test' },
                { id: 2, name: 'another test' },
                { id: 3, name: 'third test' },
            ],
        })
    }

    render() {
        return (
            <ThemeProvider theme={theme}>
                <DashboardContainer ref={this.dashboardRef} {...this.props} />
            </ThemeProvider>
        )
    }
}
