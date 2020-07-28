import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import cx from 'classnames'

const extStyles = require('src/custom-lists/components/overview/sidebar/Index.css')
import MyCollection from 'src/custom-lists/components/overview/sidebar/my-collections'
import CreateListForm from 'src/custom-lists/components/overview/sidebar/CreateListForm'
import ListItem from 'src/custom-lists/components/overview/sidebar/list-item'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import { CrowdfundingModal } from 'src/common-ui/crowdfunding'

interface StateProps {
    listName: string
    updatedListName: string
    showWarning: boolean
}

interface OwnProps {
    env: 'overview' | 'inpage'
    lists: any[]
    isDeleteConfShown: boolean
    showCreateList: boolean
    showCommonNameWarning: boolean
    showCrowdFundingModal: boolean
    getListFromDB: (...args: any[]) => any
    handleEditBtnClick: (...args: any[]) => any
    setShowCrowdFundingModal: (...args: any[]) => any
    resetListDeleteModal: (...args: any[]) => any
    handleCrossBtnClick: (...args: any[]) => any
    handleListItemClick: (...args: any[]) => any
    createPageList: (...args: any[]) => any
    updateList: (...args: any[]) => any
    handleAddPageList: (...args: any[]) => any
    handleDeleteList: (...args: any[]) => any
    toggleCreateListForm: (...args: any[]) => any
    closeCreateListForm: (...args: any[]) => any
    resetUrlDragged: (...args: any[]) => any
}

type Props = StateProps & OwnProps

export default class ListContainer extends Component<Props> {
    private inputEl: HTMLInputElement

    constructor(props) {
        super(props)
    }

    async componentDidMount() {
        // Gets all the list from the DB to populate the sidebar.
        this.props.getListFromDB()
    }

    setInputRef = (el) => (this.inputEl = el)

    handleSearchChange = (field) => (event) => {
        const { value } = event.target

        this.setState((state) => ({
            ...state,
            [field]: value,
        }))
    }

    handleSearchKeyDown = (field, listName = '') => (e) => {
        if (
            this.props.env === 'inpage' &&
            !(e.ctrlKey || e.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(e.keyCode))
        ) {
            e.preventDefault()
            e.stopPropagation()

            this.setState((state) => ({
                ...state,
                [field]:
                    (state[field] !== null ? state[field] : listName) + e.key,
            }))
        }
    }

    getSearchVal = (value) => value.trim().replace(/\s\s+/g, ' ')

    handleCreateListSubmit = (event) => {
        event.preventDefault()
        event.stopPropagation()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.createPageList(
            this.getSearchVal(value),
            this.vacateInputField,
        )
    }

    vacateInputField = () => {
        this.setState((state) => ({
            ...state,
            listName: null,
        }))
    }

    handleUpdateList = ({ id }, index) => (event) => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.updateList(index, this.getSearchVal(value), id)
        this.setState((state) => ({
            ...state,
            updatedListName: null,
        }))
    }

    renderAllLists = () => {
        return this.props.lists.map((list, i) => {
            if (list.isEditing) {
                return (
                    <CreateListForm
                        key={i}
                        onCheckboxClick={this.handleUpdateList(list, i)}
                        handleNameChange={this.handleSearchChange(
                            'updatedListName',
                        )}
                        handleNameKeyDown={this.handleSearchKeyDown(
                            'updatedListName',
                            list.name,
                        )}
                        value={
                            typeof this.props.updatedListName === 'string'
                                ? this.props.updatedListName
                                : list.name
                        }
                        showWarning={this.props.showWarning}
                        setInputRef={this.setInputRef}
                    />
                )
            }

            return (
                <ListItem
                    key={i}
                    listName={list.name}
                    isFiltered={list.isFilterIndex}
                    onShareButtonClick={() => {}}
                    onEditButtonClick={() => {
                        event.preventDefault()
                        this.props.handleEditBtnClick(i)
                    }}
                    onListItemClick={this.props.handleListItemClick(list, i)}
                    onAddPageToList={this.props.handleAddPageList(list, i)}
                    onCrossButtonClick={() => {
                        event.preventDefault()
                        this.props.handleCrossBtnClick(list, i)
                    }}
                    // resetUrlDragged={this.props.resetUrlDragged}
                    isMobileList={list.isMobileList}
                />
            )
        })
    }

    renderCreateList = (shouldDisplayForm, value = null) =>
        shouldDisplayForm ? (
            <CreateListForm
                onCheckboxClick={this.handleCreateListSubmit}
                handleNameChange={this.handleSearchChange('listName')}
                handleNameKeyDown={this.handleSearchKeyDown('listName')}
                value={this.props.listName}
                showWarning={this.props.showCommonNameWarning}
                setInputRef={this.setInputRef}
                closeCreateListForm={this.props.closeCreateListForm}
            />
        ) : null

    render() {
        return (
            <React.Fragment>
                <MyCollection
                    isForInpage
                    handleRenderCreateList={this.props.toggleCreateListForm}
                />

                {this.renderCreateList(this.props.showCreateList)}
                <div className={extStyles.allListsInPage}>
                    <div
                        className={cx(
                            extStyles.wrapper,
                            extStyles.allListsInner,
                        )}
                    >
                        {this.renderAllLists()}
                    </div>
                </div>
                <DeleteConfirmModal
                    message="Delete collection? This does not delete the pages in it"
                    isShown={this.props.isDeleteConfShown}
                    onClose={this.props.resetListDeleteModal}
                    deleteDocs={async () => {
                        // e.preventDefault()
                        this.props.handleDeleteList()
                    }}
                />
                {this.props.showCrowdFundingModal && (
                    <CrowdfundingModal
                        onClose={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            this.props.setShowCrowdFundingModal(false)
                        }}
                        context="collections"
                        learnMoreUrl="https://worldbrain.io/pricing/"
                    />
                )}
            </React.Fragment>
        )
    }
}
