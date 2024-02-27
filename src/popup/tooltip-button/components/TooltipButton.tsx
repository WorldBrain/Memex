import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ToggleSwitchButton } from '../../components/ToggleSwitchButton'
import type { RootState } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export interface OwnProps {
    closePopup: () => void
    getRootElement: () => HTMLElement
}

interface StateProps {
    isEnabled: boolean
}

interface DispatchProps {
    handleChange: React.MouseEventHandler<HTMLDivElement>
    showTooltip: React.MouseEventHandler
    initState: () => Promise<void>
}
export type Props = OwnProps & StateProps & DispatchProps

class InPageSwitches extends PureComponent<Props> {
    async componentDidMount() {
        await this.props.initState()
    }

    render() {
        return (
            <ButtonItem
                disabled={!this.props.isEnabled}
                onClick={this.props.handleChange}
            >
                <ButtonInnerContainer>
                    <Icon
                        filePath={icons.tooltipOn}
                        heightAndWidth="22px"
                        hoverOff
                    />
                    <ButtonInnerContent>
                        Enable Highlighter Tooltip
                        <SubTitle>when selecting text</SubTitle>
                    </ButtonInnerContent>
                </ButtonInnerContainer>
                <ToggleSwitchButton
                    isEnabled={this.props.isEnabled}
                    onToggleClick={null}
                    getRootElement={this.props.getRootElement}
                />
            </ButtonItem>
        )
    }
}

const ButtonInnerContainer = styled.div`
    display: flex;
    grid-gap: 15px;
    display: flex;
    align-items: center;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight}80;
    border-radius: 100px;
    height: 32px;
    width: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ButtonItem = styled.div<{ disabled: boolean }>`
    display: flex;
    grid-gap: 15px;
    width: fill-available;
    align-items: center;
    justify-content: space-between;
    padding: 5px 10px;
    margin: 0px 10px 10px 10px;
    border-radius: 8px;
    height: 50px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    border: 1px solid transparent;

    &:hover {
        border: 1px solid ${(props) => props.theme.colors.greyScale3};
    }

    & * {
        cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    }
`

const ButtonInnerContent = styled.div`
    display: flex;
    grid-gap: 5px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.greyScale6};
`

const SubTitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
`

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    isEnabled: selectors.isTooltipEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    showTooltip: async (e) => {
        e.preventDefault()
        await dispatch(acts.showTooltip())
        setTimeout(props.closePopup, 200)
    },
    handleChange: async (e) => {
        e.preventDefault()
        await dispatch(acts.toggleTooltipFlag())
        // setTimeout(props.closePopup, 200)
    },
    initState: () => dispatch(acts.init()),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(InPageSwitches)
