const sum = require('../src/options/containers/notifications/index.jsx');

const NotificationsContainer = findRenderedDOMComponentWithClass(component, 'NotificationsContainer');
expect(NotificationsContainer).to.be.ok;

// const todoText = todo.textContent;
expect(todoText).to.equal(‘Walk dog’);


const todosEle = scryRenderedComponentsWithType(component, Todo);
expect(todosEle.length).to.equal(3);
