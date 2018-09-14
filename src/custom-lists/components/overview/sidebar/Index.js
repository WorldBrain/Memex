import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import cx from 'classnames'

import { actions, selectors } from 'src/custom-lists'
import extStyles from './Index.css'
import MyCollection from './MyCollections'
import CreateListForm from './CreateListForm'
import ListItem from './ListItem'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import { CrowdfundingModal } from '../../../../common-ui/crowdfunding'
import { actions as filterActs } from '../../../../search-filters'
import * as sidebar from '../../../../overview/sidebar-left/selectors'

class ListContainer extends Component {
    static propTypes = {
        getListFromDB: PropTypes.func.isRequired,
        lists: PropTypes.array.isRequired,
        handleEditBtnClick: PropTypes.func.isRequired,
        setShowCrowdFundingModal: PropTypes.func.isRequired,
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
        showCrowdFundingModal: PropTypes.bool.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
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

    get inputBlockPattern() {
        return /[^\w\s-]/gi
    }

    setInputRef = el => (this.inputEl = el)

    handleSearchChange = field => event => {
        const { value } = event.target

        // Block input of non-words, spaces and hypens for tags
        if (this.inputBlockPattern.test(value)) {
            return
        }

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
            if (list.isEditing && this.props.isSidebarOpen) {
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
                    isFiltered={list.isFilterIndex}
                    onEditButtonClick={this.props.handleEditBtnClick(i)}
                    onShareButtonClick={this.props.setShowCrowdFundingModal(
                        true,
                    )}
                    onListItemClick={this.props.handleListItemClick(list, i)}
                    onAddPageToList={this.props.handleAddPageList(list, i)}
                    onCrossButtonClick={this.props.handleCrossBtnClick(list, i)}
                    resetUrlDragged={this.props.resetUrlDragged}
                />
            )
        })
    }

    renderCreateList = (shouldDisplayForm, value = null) =>
        shouldDisplayForm && this.props.isSidebarOpen ? (
            <CreateListForm
                onCheckboxClick={this.handleCreateListSubmit}
                handleNameChange={this.handleSearchChange('listName')}
                value={this.state.listName}
                showWarning={this.props.showCommonNameWarning}
                setInputRef={this.setInputRef}
                closeCreateListForm={this.props.closeCreateListForm}
            />
        ) : null

    render() {
        return (
            <React.Fragment>
                <MyCollection
                    handleRenderCreateList={this.props.toggleCreateListForm}
                />

                {this.renderCreateList(this.props.showCreateList)}
                <div
                    className={cx({
                        [extStyles.allLists]: this.props.isSidebarOpen,
                    })}
                >
                    <div
                        className={cx({
                            [extStyles.wrapper]: this.props.isSidebarOpen,
                            [extStyles.allListsInner]: this.props.isSidebarOpen,
                        })}
                    >
                        {this.renderAllLists()}
                    </div>
                </div>
                <DeleteConfirmModal
                    isShown={this.props.isDeleteConfShown}
                    onClose={this.props.resetListDeleteModal}
                    deleteDocs={this.props.handleDeleteList}
                />
                {this.props.showCrowdFundingModal ? (
                    <CrowdfundingModal
                        onClose={this.props.setShowCrowdFundingModal(false)}
                        context="collections"
                    />
                ) : null}
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => ({
    lists: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    showCrowdFundingModal: selectors.showCrowdFundingModal(state),
    showCreateList: selectors.showCreateListForm(state),
    showCommonNameWarning: selectors.showCommonNameWarning(state),
    isSidebarOpen: sidebar.isSidebarOpen(state),
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
    setShowCrowdFundingModal: value => e => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(actions.setShowCrowdFundingModal(value))
    },
    handleCrossBtnClick: ({ id }, index) => event => {
        event.preventDefault()
        dispatch(actions.showListDeleteModal(id, index))
    },
    handleListItemClick: ({ id }, index) => () => {
        dispatch(actions.toggleListFilterIndex(index))
        dispatch(filterActs.toggleListFilter(id))
    },
    handleAddPageList: ({ id }, index) => url => {
        dispatch(actions.addUrltoList(url, index, id))
    },
    handleDeleteList: e => {
        e.preventDefault()
        dispatch(actions.deletePageList())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ListContainer)
