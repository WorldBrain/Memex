import * as React from 'react'
import styled from 'styled-components'

interface Props {
    closePanel: () => void
}

class ExtraButtonsPanel extends React.PureComponent<Props> {
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

export default ExtraButtonsPanel

const Div = styled.div`
    padding: 10px 0px;
`
