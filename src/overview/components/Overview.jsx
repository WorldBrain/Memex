import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import propTypes from 'prop-types'

import SidebarContainer from '../../sidebar-overlay/sidebar'
import Onboarding from '../onboarding'
import { DeleteConfirmModal } from '../delete-confirm-modal'
import {
    SidebarContainer as SidebarLeft,
    SidebarIconsContainer as SidebarIcons,
} from '../sidebar-left'
import { Header, acts as searchBarActs } from '../search-bar'
import { Results } from '../results'
import Head from '../../options/containers/Head'
import DragElement from './DragElement'
import { Tooltip } from '../tooltips'
import { isDuringInstall } from '../onboarding/utils'

class Overview extends PureComponent {
    static propTypes = {
        init: propTypes.func.isRequired,
    }

    componentDidMount() {
        this.props.init()
    }

    render() {
        return (
            <React.Fragment>
                <Head />
                <Header />
                <SidebarIcons />
                <SidebarLeft />
                {isDuringInstall() ? <Onboarding /> : <Results />}
                <DeleteConfirmModal />
                <DragElement />
                <SidebarContainer env="overview" />
                <Tooltip />
            </React.Fragment>
        )
    }
}

export default connect(
    null,
    dispatch => ({ init: () => dispatch(searchBarActs.init()) }),
)(Overview)
