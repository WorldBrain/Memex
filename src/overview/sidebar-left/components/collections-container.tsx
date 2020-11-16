import React, { PureComponent } from 'react'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'
import cx from 'classnames'

import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { actions as acts, selectors } from 'src/overview/sidebar-left'
import { selectors as filters } from 'src/search-filters'
import { RootState } from 'src/options/types'

const styles = require('./collections-button.css')

interface StateProps {
    isSidebarLocked: boolean
    filteredListName?: string
}

interface DispatchProps {
    peekOpenSidebar: () => void
    lockOpenSidebar: (shouldLock: boolean) => void
    closeSidebar: () => void
}

export type Props = StateProps & DispatchProps

interface State {
    isIconHovered: boolean
}

class CollectionsButton extends PureComponent<Props, State> {
    state: State = { isIconHovered: false }

    private handleMouseEnterIcon = (e) => {
        this.props.peekOpenSidebar()

        this.setState({ isIconHovered: true })
    }

    private handleMouseLeaveIcon = (e) =>
        this.setState({ isIconHovered: false })

    private handleOpenCloseLockSidebar = () => {
        this.props.lockOpenSidebar(!this.props.isSidebarLocked)

        if (this.props.isSidebarLocked) {
            this.props.closeSidebar()
        }
    }

    render() {
        return (
            <div
                className={styles.listBtnContainer}
                onMouseEnter={this.handleMouseEnterIcon}
                onMouseLeave={this.handleMouseLeaveIcon}
                onClick={() => this.handleOpenCloseLockSidebar()}
            >
                <ButtonTooltip
                    tooltipText={
                        this.props.isSidebarLocked
                            ? 'Close Sidebar'
                            : 'Keep Sidebar Open'
                    }
                    position="bottom"
                >
                    <div
                        className={cx(styles.showListBtn, {
                            [styles.arrowIcon]:
                                this.state.isIconHovered &&
                                !this.props.isSidebarLocked,
                            [styles.arrowReverseIcon]: this.props
                                .isSidebarLocked,
                            [styles.hamburgerIcon]: !this.state.isIconHovered,
                        })}
                        onDragEnter={this.handleMouseEnterIcon}
                        onDragLeave={this.handleMouseLeaveIcon}
                    />
                </ButtonTooltip>
                {this.props.filteredListName && (
                    <div className={styles.filteredListName}>
                        {this.props.filteredListName}
                    </div>
                )}
            </div>
        )
    }
}

const mapState: MapStateToProps<StateProps, {}, RootState> = (state) => ({
    filteredListName: filters.listNameFilter(state),
    isSidebarLocked: selectors.sidebarLocked(state),
})

const mapDispatch: MapDispatchToProps<DispatchProps, {}> = (dispatch) => ({
    peekOpenSidebar: () => dispatch(acts.openSidebar()),
    closeSidebar: () => dispatch(acts.closeSidebar()),
    lockOpenSidebar: (shouldLock: boolean) =>
        dispatch((acts.setSidebarLocked as any)(shouldLock)),
})

export default connect<StateProps, DispatchProps, {}>(
    mapState,
    mapDispatch,
)(CollectionsButton)
