import React from 'react'
import { storiesOf } from '@storybook/react'

import { DashboardContainer } from 'src/dashboard-refactor'
import { theme } from 'src/common-ui/components/design-library/theme'
import { ThemeProvider } from 'styled-components'
import * as DATA from 'src/dashboard-refactor/logic.test.data'
import {
    StandardSearchResponse,
    AnnotationsSearchResponse,
} from 'src/search/background/types'

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

interface WrapperProps {
    pageResults?: StandardSearchResponse
    noteResults?: AnnotationsSearchResponse
}

class DashboardWrapper extends React.PureComponent<WrapperProps> {
    private dashboardRef = React.createRef<DashboardContainer>()

    componentDidMount() {
        if (this.props.pageResults) {
            this.dashboardRef.current.processEvent('setPageSearchResult', {
                result: this.props.pageResults,
            })
        } else if (this.props.noteResults) {
            this.dashboardRef.current.processEvent(
                'setAnnotationSearchResult',
                {
                    result: this.props.noteResults,
                },
            )
        }
    }

    render() {
        return (
            <ThemeProvider theme={theme}>
                <DashboardContainer ref={this.dashboardRef} />
            </ThemeProvider>
        )
    }
}
