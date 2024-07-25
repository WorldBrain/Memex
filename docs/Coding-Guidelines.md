Memex is a codebase that grew out of a codebase not developed by us, meaning that our coding practices evolved from there and there might be parts of the codebase that do not conform to these guidelines yet. That being said, we're converting everything bit by bit, writing new code directly as described by this guide.

# Core principles

**1. Development is not primarily about code, it's about collaboration, organization and improving people's lives.** You're building stuff that other people also work on, that affects people's lives and that has consequences in terms of what we will and will not be able to do in the future. As such, make sure things are easy to understand, that there are clear agreements of what to build, how and why.

**2. Write code with compassion** for your future self, and for those who'll be looking at it later. This means realizing that code will be read more than written, so writing clear code is preferred taking shortcuts and coming up with smart, complex code that is hard to read.

**3. Make it easy to do the right thing as lazily as possible, rather than the wrong thing.** When there's things that you can do improve things code and collaboration long-term, do them even if they take a bit more time short-term. This includes adopting Test Driven Development (TDD) setting up code in such a way that it's as easy as possible to write new tests, and making everything as type-safe as possible so lots of mistakes appear right in your editor before even running the code.

# Workflow

**Prepare and communicate** your work before you start writing anything. Think about the scope of the work you want to do, and devise a strategy how you're going to tackle the problem. Create or contribute to an issue to come to initial agreement on how you're going to proceed.

**Start developing** on a feature branch, and make a PR for it starting with `[WIP]` where you'll communicate about things that remain to be done or discussed during development.

**Write code piece by piece using TDD.** This means always writing one test first, a bit of code to make that test pass, and repeat. This explicitly doesn't mean writing code first, then writing tests. This gives you a few advantages. First, it'll force you to set up your code in a modular way so you can test each unit in a modular way. Second, it means that no untested code ever gets checked in, increasing the chances that if the test work, it's production ready (so refactoring becomes a whole less scary.) Third, once you set up the tests so you can add new ones easily, you can develop much faster than without tests. You save the code in your editor, switch to your terminal, and you see if the code works. No manual actions needed.

# Guidelines

-   **Write all new code in Typescript:** Strong typing prevents a lot of stupid mistakes and gives IDEs superpowers like helping you rename stuff throughout the whole project.
-   **Think really, really hard about how you name stuff:** Always think of descriptive names, **no abbreviations**. This means no `l`, but `userList`. No `events` for single `event`. No `userDef`, but `defaultUser` or `userDefinition` (note the ambiguity the abbreviation can introduce.) Sometimes it'll be really hard to come up with a good name for something, but really sit and try hard, since this is one of the hardest problems in computer science. Sometimes it means you actually have to re-organize your code because a single function/class is doing too many things, which you cannot find a good descriptive name for. But coming up with good names improves code quality dramatically both short- and long-term.
-   **No globals, ever:** Globals tightly couple different parts of the program and creates implicitly relationships between components that can be hard to understand. Also, it makes unit testing hard and dirty. Also, what if you want use two separate databases instead of one for example? If you explicitly pass things around through dependency injection, you can easily make these kind of changes in 1 hour instead of 1 month. This rule includes module-level stateful variables and singletons, which are both globals in disguise.
-   **No import-time code, ever:** If I import something, I expect nothing to run or be instantiated. This prevents unexpected surprises and hidden relationships.
-   **Relationships and flows in programs should be easy to follow:** If I start at the program entry point, I should be able to drill down bit by bit and easily understand what depends on what. In other words, when somebody new looks at a program, they should be able to open the main entry point and easily understand the flow of the whole program by drilling down from there.
-   **Force named parameters where callsites might become ambiguous:** Object instantiations or function calls like `inspect(object, null, 4, false)` are not fun to read. Instead, use objects for all parameters either can be hard to read, or which have no intrinsic order. For example `inspect(obj, { customReporter: null, indentationSpaces: 4, colorize: false })` is much easier to understand without needing to go to the documentation or source code. Also, if the order is not immediately obvious like `backup({ device: 'one' }, { device: 'two' })` (messing up argument order here means loss of data) rewrite it as `backup({ source: { device: 'one' }, target: { device: 'two' } })`.

# React-specific guidelines

-   **Separate logic from React components**: React components should only ever do two things: rendering and collecting input (possibly requiring DOM manipulation). It should never talk to any storage or network directly, nor calculate what to display. All of that should live in their own UI logic classes, or at least in separate functions that do not know anything about React.
-   **Clean component responsibilities**: Components should not have too many responsibilities. Split as much as possible into small stateless components. If stateful components get too big, and have too many factors that could influence their behaviour (like props) it's time to split them out. As a rough rule of the thumb, aim for 100 lines max per component.

# TDD tips and tools

-   **Test behaviours, not implementation details**: This means you're testing the public API of the module/class, not the calls it makes to get you that result. This requires you to understand what to mock and what not to give you the most useful results, and avoid tests breaking when implementation breaks. See [this video](https://www.youtube.com/watch?v=EZ05e7EMOLM) for a more in-depth explanation.
-   **Writing React components:** Testing React sucks and is usually way to complicated. We've written some tools that allow you to separate UI logic from React code, making React only responsible for rendering and input collection. You don't have to test that React layer, but do write your UI logic TDD-style. More [here](./Writing-React-Components.md)
-   **Testing cross-script communication:** TBD
-   **Testing things involving the current time:** Here you there's two strategies: 1) if you're testing a class, include a `_getNow() : Date` method that you can override from the tests, or 2) pass in the current time from the callsite, meaning having functions like `logAction(action : Action, now : Date)`.
-   **Testing storage logic:** TBD
-   **Test data fixtures:** TBD
-   **Testing data schema migrations:** TBD
-   **Integration tests:** Using all of the above tools, you should be able to set up tests in such way that entire workflows can be tested from the UI logic to an in-memory database using test data.

# Required resources to understand

-   **About clean architecture**: [this video](https://youtu.be/o_TH-Y78tt4?t=644) explains some very important basics about software architecture that you need to understand. It explains how your business logic should be the core of your application, rather than a technology or IO layer of your application (so you're creating a accountancy / data visualization / etc app, rather than a React/Cordova/Express app.) Also, it explains about how to make your code modular enough so you can adapt to changing requirements and technologies without rewriting your application.
