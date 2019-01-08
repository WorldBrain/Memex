import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RibbonContainer from '../ribbon'
import SidebarContainer, {
    State as SidebarState,
    selectors as sidebarSelectors,
} from '../../sidebar-common'
import AnnotationsManager from '../../sidebar-common/annotations-manager'

interface StateProps {
    isSidebarOpen: boolean
}

interface DispatchProps {}

interface OwnProps {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
}

type Props = StateProps & DispatchProps & OwnProps

/* tslint:disable-next-line variable-name */
const RibbonSidebarContainer = ({
    annotationsManager,
    handleRemoveRibbon,
    isSidebarOpen,
}: Props) => (
    <React.Fragment>
        {!isSidebarOpen && (
            <RibbonContainer handleRemoveRibbon={handleRemoveRibbon} />
        )}
        <SidebarContainer
            env="inpage"
            annotationsManager={annotationsManager}
        />
    </React.Fragment>
)

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    SidebarState
> = state => ({
    isSidebarOpen: sidebarSelectors.isOpen(state),
})

export default connect(mapStateToProps)(RibbonSidebarContainer)
