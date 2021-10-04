import React from 'react'
import styled from 'styled-components'

import { AnnotationPrivacyLevels } from '../types'
import { getKeyName } from 'src/util/os-specific-key-names'
import Margin from 'src/dashboard-refactor/components/Margin'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu-btn'
import SharePrivacyOption from 'src/overview/sharing/components/SharePrivacyOption'

export interface Props {
    onSave: (privacyLevel: AnnotationPrivacyLevels) => void
}

interface State {
    isPrivacyLevelShown: boolean
    privacyLevel: AnnotationPrivacyLevels
}

export default class AnnotationSaveBtn extends React.PureComponent<
    Props,
    State
> {
    state: State = {
        isPrivacyLevelShown: false,
        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
    }

    private setPrivacyLevel = (privacyLevel: AnnotationPrivacyLevels) => () =>
        this.setState({ privacyLevel, isPrivacyLevelShown: false })

    render() {
        return (
            <SaveBtn>
                <SaveBtnText
                    onClick={() => this.props.onSave(this.state.privacyLevel)}
                >
                    <Icon
                        icon={
                            this.state.privacyLevel ===
                            AnnotationPrivacyLevels.PROTECTED
                                ? 'lock'
                                : this.state.privacyLevel ===
                                  AnnotationPrivacyLevels.PRIVATE
                                ? 'person'
                                : 'shared'
                        }
                        height="14px"
                    />{' '}
                    Save
                </SaveBtnText>
                <SaveBtnArrow horizontal="1px">
                    <DropdownMenuBtn
                        btnChildren={<Icon icon="triangle" height="8px" />}
                        isOpen={this.state.isPrivacyLevelShown}
                        toggleOpen={() =>
                            this.setState((state) => ({
                                isPrivacyLevelShown: !state.isPrivacyLevelShown,
                            }))
                        }
                    >
                        <SharePrivacyOption
                            icon="shared"
                            title="Shared"
                            shortcut={`shift+${getKeyName({
                                key: 'alt',
                            })}+enter`}
                            description="Added to shared collections this page is in"
                            isSelected={
                                this.state.privacyLevel ===
                                AnnotationPrivacyLevels.SHARED
                            }
                            onClick={this.setPrivacyLevel(
                                AnnotationPrivacyLevels.SHARED,
                            )}
                        />
                        <SharePrivacyOption
                            icon="person"
                            title="Private"
                            shortcut={`${getKeyName({ key: 'mod' })}+enter`}
                            description="Private to you, until shared (in bulk)"
                            isSelected={
                                this.state.privacyLevel ===
                                AnnotationPrivacyLevels.PRIVATE
                            }
                            onClick={this.setPrivacyLevel(
                                AnnotationPrivacyLevels.PRIVATE,
                            )}
                        />
                    </DropdownMenuBtn>
                </SaveBtnArrow>
            </SaveBtn>
        )
    }
}

const SaveBtn = styled.div`
    display: flex;
    flex-direction: row;
    align-item: center;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 0 3px 5px;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 700;
    border 1px solid #f0f0f0;

    &:focus {
        background-color: grey;
    }

    &:focus {
        background-color: #79797945;
    }
`

const SaveBtnText = styled.span`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 55px;
    justify-content: space-between;
    display: flex;
`

const SaveBtnArrow = styled(Margin)`
    width: 24px;
    border-radius: 3px;

    &:hover {
        background-color: #e0e0e0;
    }
`
