import React, { PureComponent } from 'react'
import styled from 'styled-components'

export interface Props {
    progress: number
}

class ProgressBar extends PureComponent<Props> {
    render() {
        const { progress } = this.props
        return (
            <Container>
                <Bar>
                    <ProgressBarInside width={progress}>
                        {/* <span className={localStyles.percent}>
                            {Math.floor(progress)}%
                        </span> */}
                    </ProgressBarInside>
                </Bar>
            </Container>
        )
    }
}

const Container = styled.div``

const Bar = styled.div`
    background-color: ${(props) => props.theme.colors.backgroundColor};
    height: 20px;
    border-radius: 10px;
`

const ProgressBarInside = styled.div<{ width: number }>`
    height: 20px;
    background-color: ${(props) => props.theme.colors.purple};
    border-radius: 10px;
    width: ${(props) => props.width}%;
`

export default ProgressBar
