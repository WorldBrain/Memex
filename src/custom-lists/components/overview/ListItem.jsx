import React, { Component } from 'react'
import PropsTypes from 'prop-types'
import cx from 'classnames'

import styles from './Index.css'

class PageList extends Component {
    static propTypes = {
        listName: PropsTypes.string.isRequired,
        onEditButtonClick: PropsTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            isMouseInside: false,
        }
    }

    mouseEnter = () => {
        this.setState({
            isMouseInside: true,
        })
    }

    mouseLeave = () => {
        this.setState({
            isMouseInside: false,
        })
    }

    render() {
        return (
            <div
                onMouseEnter={this.mouseEnter}
                onMouseLeave={this.mouseLeave}
                className={styles.pageList}
            >
                {this.state.isMouseInside ? (
                    <button
                        className={cx(styles.editButton, styles.button)}
                        onClick={this.props.onEditButtonClick}
                    />
                ) : null}
                <div className={styles.listName}>{this.props.listName}</div>
                {this.state.isMouseInside ? (
                    <button
                        className={cx(styles.deleteButton, styles.button)}
                    />
                ) : null}
            </div>
        )
    }
}

export default PageList
