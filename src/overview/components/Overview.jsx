import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import propTypes from 'prop-types'

import SidebarContainer, {
    selectors as sidebarSelectors,
} from 'src/sidebar-overlay/sidebar'
import Onboarding from '../onboarding'
import { DeleteConfirmModal } from '../delete-confirm-modal'
import {
    SidebarContainer as SidebarLeft,
    CollectionsContainer as CollectionsButton,
} from '../sidebar-left'
import { HelpBtn } from '../help-btn'
import { Header, acts as searchBarActs } from '../search-bar'
import { Results } from '../results'
import Head from '../../options/containers/Head'
import DragElement from './DragElement'
import { Tooltip } from '../tooltips'
import { isDuringInstall } from '../onboarding/utils'
import AnnotationsManager from 'src/sidebar-overlay/annotations-manager'
import { goToAnnotation } from 'src/sidebar-overlay/sidebar/utils'

import styles from 'src/styles.css'

class Overview extends PureComponent {
    static propTypes = {
        init: propTypes.func.isRequired,
        pageUrl: propTypes.string,
    }

    componentDidMount() {
        this.props.init()
    }

    _annotationsManager = new AnnotationsManager()

    renderOnboarding() {
        return (
            <div>
                <Onboarding />
                <HelpBtn />
            </div>
        )
    }

    renderOverview() {
        return (
            <div>
                <Head />
                <CollectionsButton />
                <Header />
                <SidebarLeft />
                <Results />
                <DeleteConfirmModal message="Delete page and related note" />
                <DragElement />
                <div className={styles.productHuntContainer}>
                    <a
                        href="https://www.producthunt.com/posts/memex-1-0?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-memex-1-0"
                        target="_blank"
                    >
                        <img
                            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=151367&theme=dark"
                            alt="Memex 1.0 - Annotate, search and organize what you've read online. | Product Hunt Embed"
                            className={styles.productHuntBatch}
                        />
                    </a>
                </div>
                <SidebarContainer
                    env="overview"
                    annotationsManager={this._annotationsManager}
                    goToAnnotation={goToAnnotation(this.props.pageUrl)}
                />
                <Tooltip />
                <HelpBtn />
            </div>
        )
    }

    render() {
        return (
            <React.Fragment>
                {isDuringInstall()
                    ? this.renderOnboarding()
                    : this.renderOverview()}
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
