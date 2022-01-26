import React, { HTMLProps } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    showEditBtn: boolean
    onEditBtnClick: React.MouseEventHandler
    lists: Array<{ id: number; name: string }>
    onListClick?: (tag: number) => void
    renderListsPickerForAnnotation: () => JSX.Element
}

interface ButtonProps {
    hasNoLists: boolean
    onEditBtnClick: React.MouseEventHandler
    renderListsPickerForAnnotation: () => JSX.Element
}

export class AddSpacesButton extends React.Component<
    ButtonProps,
    { showPicker: boolean }
> {
    constructor(props: ButtonProps) {
        super(props)
        this.state = {
            showPicker: false,
        }
    }

    render() {
        return (
            <SpacePickerButtonWrapper>
                <AddSpacesButtonContainer
                    onClick={(e) => {
                        // this.setState({ showPicker: !this.state.showPicker })
                        this.props.onEditBtnClick(e)
                    }}
                >
                    {this.props.hasNoLists ? (
                        <ButtonBox>
                            <Icon
                                filePath={icons.collectionsEmpty}
                                height={'12px'}
                                color={'subText'}
                            />
                            Add to Space
                        </ButtonBox>
                    ) : (
                        <Icon icon={'plus'} height={'10px'} color={'subText'} />
                    )}
                </AddSpacesButtonContainer>
                {this.props.renderListsPickerForAnnotation && (
                    <SpacePickerWrapper
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                    >
                        {this.props.renderListsPickerForAnnotation()}
                    </SpacePickerWrapper>
                )}
            </SpacePickerButtonWrapper>
        )
    }
}

const SpacePickerButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
`

const SpacePickerWrapper = styled.div`
    position: relative;

    width: 0rem;
`

export default function ListsSegment({
    lists,
    onListClick,
    showEditBtn,
    onEditBtnClick,
    renderListsPickerForAnnotation,
    ...props
}: Props) {
    return (
        <Container {...props}>
            <ListsContainer>
                <AddSpacesButton
                    hasNoLists={lists.length === 0}
                    onEditBtnClick={onEditBtnClick}
                    renderListsPickerForAnnotation={
                        renderListsPickerForAnnotation
                    }
                />
                {lists
                    .filter(
                        (l) => !Object.values(SPECIAL_LIST_IDS).includes(l.id),
                    )
                    .slice(0)
                    .map((space) => (
                        <ListSpaceContainer
                            key={space.id}
                            onClick={
                                onListClick
                                    ? () => onListClick(space.id)
                                    : undefined
                            }
                        >
                            {space.name}
                            {/* TODO: uncomment when collection context menu is done */}
                            {/* {showEditBtn && (
                            <ListPillSettingButton
                                onClick={() => {
                                    // open the space context modal
                                }}
                            >
                                {' ... '}
                            </ListPillSettingButton>
                        )} */}
                        </ListSpaceContainer>
                    ))}
            </ListsContainer>
        </Container>
    )
}

const Container = styled.div`
    display: inline-box;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #f0f0f0;
    padding: 5px 15px;
`

const ButtonBox = styled.div`
    padding: 0 8px;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;
    color: ${(props) => props.theme.colors.subText};
`

const AddSpacesButtonContainer = styled.div`
    background-color: white;
    padding: 2px 2px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    font-size: 12px;
    font-weight: 400;
    height: 24px;
    min-width: 24px;
    justify-content: center;
    color: #284150;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    align-items: center;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;

    &:hover {
        background: #f0f0f0;
    }
`
const ListsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`

const ListSpaceContainer = styled.div`
    background-color: #83c9f4;

    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    height: auto;
    color: #284150;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    align-items: center;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;
`
const ListPillSettingButton = styled.button`
    cursor: pointer;
`

const EditIcon = styled.button`
    border: none;
    outline: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: ${(props) => props.theme.colors.primary};
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
    right: 30px;
    position: relative;
    z-index: 10;
`
