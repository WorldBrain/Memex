import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import cx from 'classnames'

import { actions, selectors } from 'src/custom-lists'
import extStyles from './Index.css'
import MyCollection from './my-collections'
import CreateListForm from './CreateListForm'
import ListItem from './list-item'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import { actions as filterActs } from 'src/search-filters'
import { selectors as sidebar } from 'src/overview/sidebar-left'

class ListContainer extends Component {
    static propTypes = {
        getListFromDB: PropTypes.func.isRequired,
        lists: PropTypes.array.isRequired,
        handleEditBtnClick: PropTypes.func.isRequired,
        isDeleteConfShown: PropTypes.bool.isRequired,
        resetListDeleteModal: PropTypes.func.isRequired,
        handleCrossBtnClick: PropTypes.func.isRequired,
        handleListItemClick: PropTypes.func.isRequired,
        createPageList: PropTypes.func.isRequired,
        updateList: PropTypes.func.isRequired,
        handleAddPageList: PropTypes.func.isRequired,
        handleDeleteList: PropTypes.func.isRequired,
        toggleCreateListForm: PropTypes.func.isRequired,
        showCreateList: PropTypes.bool.isRequired,
        showCommonNameWarning: PropTypes.bool.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        isSidebarLocked: PropTypes.bool.isRequired,
        closeCreateListForm: PropTypes.func.isRequired,
        resetUrlDragged: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            listName: null,
            updatedListName: null,
            showWarning: false,
        }
    }

    async componentDidMount() {
        // Gets all the list from the DB to populate the sidebar.
        this.props.getListFromDB()
    }

    setInputRef = el => (this.inputEl = el)

    handleSearchChange = field => event => {
        const { value } = event.target

        this.setState(state => ({
            ...state,
            [field]: value,
        }))
    }

    getSearchVal = value => value.trim().replace(/\s\s+/g, ' ')

    handleCreateListSubmit = event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.createPageList(
            this.getSearchVal(value),
            this.vacateInputField,
        )
    }

    vacateInputField = () => {
        this.setState(state => ({
            ...state,
            listName: null,
        }))
    }

    handleUpdateList = ({ id }, index) => event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.updateList(index, this.getSearchVal(value), id)
        this.setState(state => ({
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
                        value={
                            typeof this.state.updatedListName === 'string'
                                ? this.state.updatedListName
                                : list.name
                        }
                        showWarning={this.state.showWarning}
                        setInputRef={this.setInputRef}
                    />
                )
            }
            return (
                <ListItem
                    key={i}
                    listName={list.name}
                    isMobileList={list.isMobileList}
                    isFiltered={list.isFilterIndex}
                    onEditButtonClick={this.props.handleEditBtnClick(i)}
                    onListItemClick={this.props.handleListItemClick(list, i)}
                    onAddPageToList={this.props.handleAddPageList(list, i)}
                    onCrossButtonClick={this.props.handleCrossBtnClick(list, i)}
                    resetUrlDragged={this.props.resetUrlDragged}
                />
            )
        })
    }

    renderCreateList = (shouldDisplayForm, value = null) =>
        shouldDisplayForm && (
            <CreateListForm
                onCheckboxClick={this.handleCreateListSubmit}
                handleNameChange={this.handleSearchChange('listName')}
                value={this.state.listName}
                showWarning={this.props.showCommonNameWarning}
                setInputRef={this.setInputRef}
                closeCreateListForm={this.props.closeCreateListForm}
            />
        )

    render() {
        return (
            <React.Fragment>
                <MyCollection
                    isSidebarLocked={this.props.isSidebarLocked}
                    handleRenderCreateList={this.props.toggleCreateListForm}
                />

                {this.renderCreateList(this.props.showCreateList)}
                <div
                    className={cx({
                        [extStyles.allLists]: this.props.isSidebarOpen,
                        [extStyles.allListsLocked]: this.props.isSidebarLocked,
                    })}
                >
                    <div
                        className={cx({
                            [extStyles.wrapper]: this.props.isSidebarOpen,
                            [extStyles.allListsInner]: this.props.isSidebarOpen,
                            [extStyles.wrapperLocked]: this.props
                                .isSidebarLocked,
                        })}
                    >
                        {this.props.lists.length === 1 ? (
                            <div>
                                {this.renderAllLists()}
                                <div className={extStyles.noLists}>
                                    <strong>
                                        You don't have any collections{' '}
                                    </strong>
                                    <br />
                                    Create one with the + icon and drag and drop
                                    items into it.
                                </div>
                            </div>
                        ) : (
                            <div>{this.renderAllLists()}</div>
                        )}
                    </div>
                </div>
                <DeleteConfirmModal
                    message="Delete collection? This does not delete the pages in it"
                    isShown={this.props.isDeleteConfShown}
                    onClose={this.props.resetListDeleteModal}
                    deleteDocs={this.props.handleDeleteList}
                />
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => ({
    lists: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    showCreateList: selectors.showCreateListForm(state),
    showCommonNameWarning: selectors.showCommonNameWarning(state),
    isSidebarOpen: sidebar.isSidebarOpen(state),
    isSidebarLocked: sidebar.sidebarLocked(state),
})

const mapDispatchToProps = (dispatch, getState) => ({
    ...bindActionCreators(
        {
            resetListDeleteModal: actions.resetListDeleteModal,
            getListFromDB: actions.getListFromDB,
            createPageList: actions.createPageList,
            updateList: actions.updateList,
            toggleCreateListForm: actions.toggleCreateListForm,
            closeCreateListForm: actions.closeCreateListForm,
            resetUrlDragged: actions.resetUrlDragged,
        },
        dispatch,
    ),
    handleEditBtnClick: index => event => {
        event.preventDefault()
        dispatch(actions.showEditBox(index))
    },
    handleCrossBtnClick: ({ id }, index) => event => {
        event.preventDefault()
        dispatch(actions.showListDeleteModal(id, index))
    },
    handleListItemClick: ({ id, isMobileList }, index) => () => {
        dispatch(actions.toggleListFilterIndex(index))
        dispatch(
            filterActs.toggleListFilter({
                id,
                isMobileListFiltered: isMobileList,
            }),
        )
    },
    handleAddPageList: ({ id, isMobileList }, index) => (url, isSocialPost) => {
        if (!isMobileList) {
            dispatch(actions.addUrltoList(url, isSocialPost, index, id))
        }
    },
    handleDeleteList: e => {
        e.preventDefault()
        dispatch(actions.deletePageList())
        dispatch(filterActs.delListFilter())
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(ListContainer)
