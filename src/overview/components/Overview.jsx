import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import propTypes from 'prop-types'

import SidebarContainer, {
    selectors as sidebarSelectors,
} from '../../sidebar-common'
import Onboarding from '../onboarding'
import { DeleteConfirmModal } from '../delete-confirm-modal'
import {
    SidebarContainer as SidebarLeft,
    CollectionsContainer as CollectionsButton,
} from '../sidebar-left'
import { Header, acts as searchBarActs } from '../search-bar'
import { Results } from '../results'
import Head from '../../options/containers/Head'
import DragElement from './DragElement'
import { Tooltip } from '../tooltips'
import { isDuringInstall } from '../onboarding/utils'
import AnnotationsManager from '../../sidebar-common/annotations-manager'
import { goToAnnotation } from '../utils'

class Overview extends PureComponent {
    static propTypes = {
        init: propTypes.func.isRequired,
        pageUrl: propTypes.string,
    }

    componentDidMount() {
        this.props.init()
    }

    _annotationsManager = new AnnotationsManager()

    render() {
        return (
            <React.Fragment>
                {isDuringInstall() ? (
                    <Onboarding />
                ) : (
                    <div>
                        <Head />
                        <CollectionsButton />
                        <Header />
                        <SidebarLeft />
                        <Results />
                        <DeleteConfirmModal message="Delete page and related note" />
                        <DragElement />
                        <SidebarContainer
                            env="overview"
                            annotationsManager={this._annotationsManager}
                            goToAnnotation={goToAnnotation(this.props.pageUrl)}
                        />
                        <Tooltip />
                    </div>
                )}
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => ({
    pageUrl: sidebarSelectors.pageUrl(state),
})

export default connect(
    mapStateToProps,
    dispatch => ({ init: () => dispatch(searchBarActs.init()) }),
)(Overview)
