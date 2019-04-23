import React, { PureComponent, MouseEventHandler } from 'react'

const styles = require('./semi-circular-ribbon.css')

export interface Props {
    crossIconSrc?: string
    title?: string
    onClick: MouseEventHandler
}

class SemiCircularRibbon extends PureComponent<Props> {
    static defaultProps = {
        title: 'Remove from this collection',
        crossIconSrc: '/img/cross_grey.svg',
    }

    render() {
        return (
            <div
                title={this.props.title}
                className={styles.ribbon}
                onClick={this.props.onClick}
            />
        )
    }
}

export default SemiCircularRibbon
