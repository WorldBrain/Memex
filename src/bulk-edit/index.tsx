import React from 'react'
import styled, { css } from 'styled-components'
import Logic, { Dependencies, State, Event } from './logic'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { StatefulUIElement } from 'src/util/ui-logic'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

export interface Props extends Dependencies {
    disableWriteOps?: boolean
    getRootElement: () => HTMLElement
}

// NOTE: This exists to stop click events bubbling up into web page handlers AND to stop page result <a> links
//  from opening when you use the context menu in the dashboard.
//  __If you add new click handlers to this component, ensure you wrap them with this!__
const wrapClick = (
    handler: React.MouseEventHandler,
): React.MouseEventHandler => (e) => {
    e.preventDefault()
    e.stopPropagation()
    return handler(e)
}

export default class BulkEditWidget extends StatefulUIElement<
    Props,
    State,
    Event
> {
    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private bulkEditWidgetBtnRef = React.createRef<HTMLDivElement>()
    private spacePickerBtnRef = React.createRef<HTMLDivElement>()

    private renderLoadingSpinner = () => <LoadingIndicator size={30} />

    renderBulkSelectItem(item) {
        return (
            <BulkSelectItemBox>
                <BulkSelectItemTitle>{item.title}</BulkSelectItemTitle>
                <RemoveIconBox>
                    <Icon
                        icon={'removeX'}
                        heightAndWidth={'16px'}
                        color={'white'}
                        background="greyScale1"
                        onClick={() => {
                            const itemData = {
                                type: item.type,
                                url: item.url,
                                title: item.title,
                            }
                            this.props.removeIndividualSelection(itemData)
                        }}
                    />
                </RemoveIconBox>
            </BulkSelectItemBox>
        )
    }

    renderBulkEditSelectionBox = () => {
        if (this.state.showBulkEditSelectionBox) {
            return (
                <PopoutBox
                    targetElementRef={this.bulkEditWidgetBtnRef.current}
                    placement={'top'}
                    offsetX={10}
                    offsetY={-10}
                    closeComponent={(e) => {
                        this.processEvent('showBulkEditSelectionBox', {
                            isShown: false,
                        })
                    }}
                    strategy={'fixed'}
                    width={'200px'}
                    instaClose
                    getPortalRoot={this.props.getRootElement}
                >
                    <BulkSelectListContainer>
                        {this.state.bulkSelectedItems.map((item) =>
                            this.renderBulkSelectItem(item),
                        )}
                    </BulkSelectListContainer>
                </PopoutBox>
            )
        }
    }
    renderSpacePicker = () => {
        if (this.state.showSpacePicker) {
            return (
                <PopoutBox
                    targetElementRef={this.spacePickerBtnRef.current}
                    placement={'top'}
                    offsetX={10}
                    offsetY={-10}
                    closeComponent={(e) => {
                        this.processEvent('showSpacePicker', {
                            isShown: false,
                        })
                    }}
                    strategy={'fixed'}
                    width={'fit-content'}
                    instaClose
                    getPortalRoot={this.props.getRootElement}
                >
                    {this.props.spacePicker()}
                </PopoutBox>
            )
        }
    }

    render() {
        if (this.state.itemCounter > 0) {
            if (this.props.bulkDeleteLoadingState === 'running') {
                return (
                    <BulkEditWidgetContainer
                        bulkDeleteLoadingState={
                            this.props.bulkDeleteLoadingState
                        }
                    >
                        <ProgressInfoBox>
                            <LoadingIndicator size={30} />
                            {this.state.itemCounter} left to process
                        </ProgressInfoBox>
                    </BulkEditWidgetContainer>
                )
            } else {
                return (
                    <BulkEditWidgetContainer
                        bulkDeleteLoadingState={
                            this.props.bulkDeleteLoadingState
                        }
                    >
                        {this.renderBulkEditSelectionBox()}
                        {this.renderSpacePicker()}
                        <BulkEditWidgetBox>
                            {!this.state.showConfirmBulkDeletion && (
                                <>
                                    <CounterBox>
                                        <Counter>
                                            {this.state.itemCounter}
                                        </Counter>
                                        Selected
                                    </CounterBox>
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'showBulkEditSelectionBox',
                                                {
                                                    isShown: !this.state
                                                        .showBulkEditSelectionBox,
                                                },
                                            )
                                        }
                                        label={`Show Selected`}
                                        type={'tertiary'}
                                        size={'small'}
                                        icon={'arrowRight'}
                                        padding={'0px 8px 0 3px'}
                                        innerRef={this.bulkEditWidgetBtnRef}
                                    />
                                    <PrimaryAction
                                        width="120px"
                                        onClick={() => {
                                            if (
                                                this.state
                                                    .selectAllLoadingState !==
                                                'running'
                                            ) {
                                                this.processEvent(
                                                    'selectAllPages',
                                                    null,
                                                )
                                            }
                                        }}
                                        label={
                                            this.state.selectAllLoadingState ===
                                            'running' ? (
                                                <LoadingStateButton>
                                                    <LoadingIndicator
                                                        size={16}
                                                    />
                                                </LoadingStateButton>
                                            ) : (
                                                'Select All'
                                            )
                                        }
                                        type={'forth'}
                                        size={'small'}
                                        icon={'multiEdit'}
                                        padding={'0px 8px 0 3px'}
                                    />
                                    <PrimaryAction
                                        onClick={async () =>
                                            await this.props.clearBulkSelection()
                                        }
                                        label={`Clear Selection`}
                                        type={'forth'}
                                        size={'small'}
                                        icon={'removeX'}
                                        padding={'0px 8px 0 3px'}
                                    />
                                </>
                            )}
                            {this.state.showConfirmBulkDeletion ? (
                                <DeleteConfirmBox>
                                    Action cannot be undone. Are you sure?
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'promptConfirmDeleteBulkSelection',
                                                { isShown: false },
                                            )
                                        }
                                        label={`Cancel`}
                                        type={'forth'}
                                        size={'small'}
                                        icon={'removeX'}
                                        padding={'0px 8px 0 3px'}
                                    />
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'deleteBulkSelection',
                                                null,
                                            )
                                        }
                                        label={`Confirm`}
                                        type={'secondary'}
                                        size={'small'}
                                        icon={'trash'}
                                        padding={'0px 8px 0 3px'}
                                    />{' '}
                                </DeleteConfirmBox>
                            ) : (
                                <PrimaryAction
                                    onClick={() =>
                                        this.processEvent(
                                            'promptConfirmDeleteBulkSelection',
                                            { isShown: true },
                                        )
                                    }
                                    label={`Delete`}
                                    type={'secondary'}
                                    size={'small'}
                                    icon={'trash'}
                                    padding={'0px 8px 0 3px'}
                                />
                            )}
                            <PrimaryAction
                                onClick={() =>
                                    this.processEvent('showSpacePicker', {
                                        isShown: true,
                                    })
                                }
                                label={
                                    this.props.bulkEditSpacesLoadingState ===
                                    'running' ? (
                                        <LoadingStateButton>
                                            <LoadingIndicator size={16} />
                                        </LoadingStateButton>
                                    ) : (
                                        'Add to Spaces'
                                    )
                                }
                                type={'secondary'}
                                size={'small'}
                                icon={'plus'}
                                padding={'0px 8px 0 3px'}
                                innerRef={this.spacePickerBtnRef}
                            />
                        </BulkEditWidgetBox>
                    </BulkEditWidgetContainer>
                )
            }
        } else {
            return null
        }
    }
}

const BulkEditWidgetContainer = styled.div<{
    bulkDeleteLoadingState: UITaskState
}>`
    position: absolute;
    bottom: 0;
    height: 44px;
    background-color: ${(props) => props.theme.colors.black}80;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(10px);
    z-index: 1000000;

    ${(props) =>
        props.bulkDeleteLoadingState === 'running' &&
        css`
            height: 100%;
        `}
`

const BulkEditWidgetBox = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    justify-content: center;
`

const LoadingStateButton = styled.div`
    width: 55px;
    display: flex;
    align-items: center;
    justify-content: center;
`

const ProgressInfoBox = styled.div`
    display: flex;
    grid-gap: 15px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 300;
    font-size: 16px;
`

const RemoveIconBox = styled.div`
    display: none;
    position: absolute;
    right: 0px;
`

const BulkSelectListContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 400px;
    overflow: scroll;
    padding: 10px;
`

const BulkSelectItemBox = styled.div`
    display: flex;
    max-width: 300px;
    justify-content: space-between;
    grid-gap: 5px;
    align-items: center;
    position: relative;

    &:hover ${RemoveIconBox} {
        display: flex;
        position: absolute;
        right: 0px;
    }
`
const BulkSelectItemTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    padding: 10px;
    white-space: nowrap;
    overflow: hidden;
    display: block;
    align-items: center;
    height: 20px;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 50px;
`

const CounterBox = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 16px;
    font-weight: 300;
`

const Counter = styled.div`
    color: ${(props) => props.theme.colors.prime1};
    font-size: 16px;
    font-weight: 700;
`

const DeleteConfirmBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    font-weight: 300;
`
