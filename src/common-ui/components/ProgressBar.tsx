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
    background-color: ${(props) => props.theme.colors.black};
    height: 10px;
    border-radius: 3px;
`

const ProgressBarInside = styled.div<{ width: number }>`
    height: 10px;
    background-color: ${(props) => props.theme.colors.prime1};
    border-radius: 3px;
    width: ${(props) => props.width}%;
`

export default ProgressBar
