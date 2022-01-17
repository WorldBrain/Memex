import React, { HTMLProps } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    lists: string[]
    showEditBtn: boolean
    onListClick?: (tag: string) => void
    onEditBtnClick: React.MouseEventHandler
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
                        <>
                            <span>+</span> <span>Add to Space</span>
                        </>
                    ) : (
                        <span>+</span>
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
    // if (!lists?.length) {
    //     return null
    // }

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
                {lists.slice(0).map((space) => (
                    <ListSpaceContainer
                        key={space}
                        onClick={
                            onListClick ? () => onListClick(space) : undefined
                        }
                    >
                        {space}
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

const AddSpacesButtonContainer = styled.button`
    background-color: white;

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
