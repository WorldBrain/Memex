import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import CongratsMessage from '../../components/CongratsMessage'
import CommentBoxContainer from '../../comment-box'
import menuStyles from './menu-styles'

const styles = require('./sidebar.css')

interface Props {
    showSidebar: boolean
    showCongratsMessage: boolean
    handleStateChange: (...args: any[]) => any
    renderAnnotations: (...args: any[]) => any
    toggleMouseOnSidebar: (...args: any[]) => any
    updateAnnotations: (...args: any[]) => any
    env: 'iframe' | 'overview'
}

/* tslint:disable-next-line variable-name */
const Sidebar = (props: Props) => (
    <Menu
        isOpen={props.showSidebar}
        onStateChange={props.handleStateChange}
        width={340}
        styles={menuStyles}
        right
        noOverlay
        disableCloseOnEsc
    >
        <div
            className={styles.sidebar}
            onMouseEnter={props.toggleMouseOnSidebar}
            onMouseLeave={props.toggleMouseOnSidebar}
            id="memex_sidebar_panel"
        >
            {props.showSidebar ? (
                <CommentBoxContainer
                // updateAnnotations={props.updateAnnotations}
                />
            ) : null}

            <div className={styles.separator} />

            <div className={styles.annotationContainer}>
                {props.renderAnnotations()}
                {props.showCongratsMessage && <CongratsMessage />}
            </div>
        </div>
    </Menu>
)

export default Sidebar
