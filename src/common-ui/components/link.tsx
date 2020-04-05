import * as React from 'react'
import cx from 'classnames'

const styles = require('./link.css')

export interface Props {
    url: string
    text?: string
}

class Link extends React.PureComponent<Props> {
    private handleClickOpenNewTab = (url: string) => (
        e: React.MouseEvent<HTMLAnchorElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        window.open(url, '_blank').focus()
    }

    render() {
        const { url, text } = this.props
        return (
            <a
                onClick={this.handleClickOpenNewTab(url)}
                className={cx(styles.link)}
            >
                {text ? text : url}
            </a>
        )
    }
}

export default Link
