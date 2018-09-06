import React, { PureComponent, MouseEventHandler } from 'react'

const styles = require('./SemiCircularRibbon.css')

export interface Props {
    crossIconSrc?: string
    title?: string
    onClick: MouseEventHandler<HTMLImageElement>
}

class SemiCircularRibbon extends PureComponent<Props> {
    static defaultProps = {
        title: 'Remove from this collection',
        crossIconSrc: '/img/cross_grey.svg',
    }

    render() {
        return (
            <div title={this.props.title} className={styles.ribbon}>
                <img
                    onClick={this.props.onClick}
                    src={this.props.crossIconSrc}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                />
            </div>
        )
    }
}

export default SemiCircularRibbon
