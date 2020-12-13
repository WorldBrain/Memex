import React from 'react'
import { storiesOf } from '@storybook/react'

import { DashboardContainer } from 'src/dashboard-refactor'
import { theme } from 'src/common-ui/components/design-library/theme'
import { ThemeProvider } from 'styled-components'
import * as DATA from 'src/dashboard-refactor/logic.test.data'

const stories = storiesOf('Dashboard Refactor|Dashboard', module)

stories.add('Default', () => <DashboardWrapper />)

class DashboardWrapper extends React.PureComponent {
    private dashboardRef = React.createRef<DashboardContainer>()

    componentDidMount() {
        this.dashboardRef.current.processEvent('setPageSearchResult', {
            result: DATA.PAGE_SEARCH_RESULT_1,
        })
    }

    render() {
        return (
            <ThemeProvider theme={theme}>
                <DashboardContainer ref={this.dashboardRef} />
            </ThemeProvider>
        )
    }
}
