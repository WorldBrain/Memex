import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'
import { bindActionCreators } from 'redux'

import { actions, selectors } from 'src/custom-lists'
import extStyles from './Index.css'
import MyCollection from './MyCollections'
import CreateListForm from './CreateListForm'
import ListItem from './ListItem'
import DeleteConfirmModal from './DeleteConfirmModal'
import { actions as filterActs } from 'src/overview/filters'

import { styles } from './ReactBurgerMenu'

class ListContainer extends Component {
    static propTypes = {
        getListFromDB: PropTypes.func.isRequired,
        lists: PropTypes.array.isRequired,
        handleEditBtnClick: PropTypes.func.isRequired,
        isDeleteConfShown: PropTypes.bool.isRequired,
        resetListDeleteModal: PropTypes.func.isRequired,
        handleCrossBtnClick: PropTypes.func.isRequired,
        handleListItemClick: PropTypes.func.isRequired,
        resetFilters: PropTypes.func.isRequired,
        createPageList: PropTypes.func.isRequired,
        updateList: PropTypes.func.isRequired,
        handleAddPageList: PropTypes.func.isRequired,
        handleDeleteList: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            showCreateList: false,
            listName: null,
            updatedListName: null,
            showWarning: false,
        }
    }

    async componentWillMount() {
        // Gets all the list from the DB to populate the sidebar.
        this.props.getListFromDB()
    }

    get inputBlockPattern() {
        return /[^\w\s-]/gi
    }

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

    handleRenderCreateList = () =>
        this.setState({
            showCreateList: !this.state.showCreateList,
        })

    // TODO: change this method;
    handleCreateListSubmit = event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        // TODO: Place a check here for same list name or place it in the createPageList
        this.props.createPageList(value)

        this.setState({
            showCreateList: false,
            listName: null,
        })
    }

    handleUpdateList = ({ id }, index) => event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.updateList(index, value, id)
        this.setState({
            updatedListName: null,
        })
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
                    />
                )
            }
            return (
                <ListItem
                    key={i}
                    listName={list.name}
                    isFiltered={list.isFilterIndex}
                    onEditButtonClick={this.props.handleEditBtnClick(i)}
                    onListItemClick={this.props.handleListItemClick(list.id, i)}
                    onAddPageToList={this.props.handleAddPageList(list, i)}
                    onCrossButtonClick={this.props.handleCrossBtnClick(list, i)}
                />
            )
        })
    }

    renderCreateList = (shouldDisplayForm, value = null) =>
        shouldDisplayForm ? (
            <CreateListForm
                onCheckboxClick={this.handleCreateListSubmit}
                handleNameChange={this.handleSearchChange('listName')}
                value={this.state.listName}
                showWarning={this.state.showWarning}
            />
        ) : null

    render() {
        return (
            <div>
                <div>
                    <Menu
                        styles={styles}
                        noOverlay
                        customBurgerIcon={<img src="/img/sidebar_icon.svg" />}
                        customCrossIcon={<img src="/img/cross.svg" />}
                    >
                        <a
                            onClick={this.props.resetFilters}
                            className={extStyles.showAll}
                        >
                            Show All
                        </a>

                        <hr className={extStyles.hr} />

                        <MyCollection
                            handleRenderCreateList={this.handleRenderCreateList}
                        />

                        {this.renderCreateList(this.state.showCreateList)}
                        <div className={extStyles.allLists}>
                            {this.renderAllLists()}
                        </div>
                        <DeleteConfirmModal
                            isShown={this.props.isDeleteConfShown}
                            onClose={this.props.resetListDeleteModal}
                            deleteList={this.props.handleDeleteList}
                        />
                    </Menu>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => ({
    lists: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
})

const mapDispatchToProps = (dispatch, getState) => ({
    ...bindActionCreators(
        {
            resetListDeleteModal: actions.resetListDeleteModal,
            resetFilters: filterActs.resetFilters,
            getListFromDB: actions.getListFromDB,
            createPageList: actions.createPageList,
            updateList: actions.updateList,
        },
        dispatch,
    ),
    listStorageHandler: () => dispatch(actions.listStorage()),
    handleEditBtnClick: index => event => {
        event.preventDefault()
        dispatch(actions.showEditBox(index))
    },
    handleCrossBtnClick: ({ id }, index) => event => {
        event.preventDefault()
        dispatch(actions.showListDeleteModal(id, index))
    },
    handleListItemClick: (id, index) => () => {
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
