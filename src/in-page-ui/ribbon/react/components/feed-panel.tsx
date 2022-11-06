import * as React from 'react'
import styled from 'styled-components'
import onClickOutside from 'react-onclickoutside'

interface Props {
    closePanel: () => void
}

class FeedPanel extends React.PureComponent<Props> {
    async componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown)
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.props.closePanel()
        }
    }

    handleClickOutside = () => {
        this.props.closePanel()
    }

    render() {
        return <Div>{this.props.children}</Div>
    }
}

export default onClickOutside(FeedPanel)

const Div = styled.div`
    height: fill-available;
    width: fill-available;
`
