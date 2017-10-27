// Takes advantage of React 16 render method return types to allow a component that doesn't have
//  any corresponding representation in the DOM. Like a "noop" component.
//  Use to cleanup markup.
export default ({ children }) => children
