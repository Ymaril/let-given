# Context variables for testing frameworks

[![let-given NPM version](https://badge.fury.io/js/let-given.svg)](http://badge.fury.io/js/let-given)

Well-typed context variables for testing frameworks with async functions support

<details>
  <summary>Fast example</summary>

  ```js

  const { useGiven } = require("let-given");

  const { letGiven, it } = useGiven();

  describe("User", () => {
    letGiven("user", async ({ userParams }) => {
      return await User.create(userParams);
    }, ["userParams"])

    letGiven("userParams", ({ name, phone, key }) => {
      return {
        name: name,
        phone: phone,
        key: key
      }
    }, ["name", "phone", "key"]);

    letGiven("name", () => "John");
    letGiven("phone", () => "123456789");
    letGiven("key", async () => await (new KeyGenerator()).generate());

    it("successful save", ({ user, key }) => {
      expect(user.isPersisted).toBeTruthy();
      expect(user.name).toEqual("John");
      expect(user.phone).toEqual("123456789");
      expect(user.key).toEqual(key);
    });

    describe("wrong key", () => {
      letGiven("key", () => undefined);

      it("failed save", ({ user }) => {
        expect(user.isPersisted).toBeFalsy();
        expect(user.errors).toEqual("Wrong key");
      });
    });

    describe("with optional field city", () => {
      letGiven("city", () => "London");
      letGiven("userParams", ({ userParams, city }) => {
        userParams.city = city;

        return userParams;
      });

      it("successful save", ({ user }) => {
        expect(user.isPersisted).toBeTruthy();
        expect(user.city).toEqual("London");
      });

      describe("wrong city", () => {
        letGiven("city", () => "New York");

        it("failed save", ({ user }) => {
          expect(user.isPersisted).toBeFalsy();
          expect(user.errors).toEqual("City is not located in UK");
        });
      });
    });
  });

  ```
</details>

## Getting started

### Installation

```bash
npm install let-given --save-dev
```

### Usage

let-given is compatible with all popular testing frameworks([mocha][mocha], [jasmine][jasmine] and [jest][jest]). [You can also use it with other frameworks](#custom-it-wrap)

```js
const { useGiven } = require("let-given");

const { letGiven, it } = useGiven();

describe("User", () => {
  letGiven("user", ({ userParams }) => User.create(userParams), ["userParams"])
  letGiven("userParams", ({ name }) => ({ name }), ["name"]);

  letGiven("name", () => "John");

  it("successful save", ({ user, key }) => {
    expect(user.isPersisted).toBeTruthy();
    expect(user.name).toEqual("John");
  });
});
```

#### letGiven function

letGiven describes a context variable. It takes 3 parameters: variable name, variable definition function and an array of dependencies of this variable.
```ts
letGiven(name: string, func: (given: object) => any, dependencies: string[]);
```
- name - The name of the context variable. It will be used as the name of the field and in the dependency array
- func - A function that defines a variable. The value it will return will be the value of that context variable
- dependencies - An array of variable names on whose values this variable depends. The values of these dependencies will be passed to the func

## Features

### Assertation "it" redefine

let-given determines which test framework it works with. And returns the wrapped "it" functions in useGivendepending on the framework

```js
// jasmine
const { letGiven, it, xit, fit } = useGiven();
// jest
const { letGiven, it, fit, xit, test, xtest } = useGiven();
// mocha(it object includes fields only, skip)
const { letGiven, it } = useGiven();
const { only, skip } = it;
```

Like the original "it", the second argument of wrapped "it" function takes an assertation function. However, in the wrapped version, the given object with all the variables created by letGiven will be passed to this function as the first argument.

```js
letGiven("name", () => "John");
it("successful save", function (given) {
  expect(given.name).toEqual("John");
});
```

### Execute only the last variable definition

let-given will not execute functions for variables that are redefined deeper in the test suites

```js
letGiven("name", async () => {
  return await slowNameGenerator.generate(); // this code will not execute
});
describe("with simple name", () => {
  letGiven("name", () => "John");

  it("successful save", function (given) {
    expect(given.name).toEqual("John");
  });
});
```
[The exception is the use of super variables](#super-variables)

### Full typescript support

let-given has strong typescript typing

```js
// In a typescript, you must specify a test framework
import useGiven from "let-given/dist/jasmine"; // There are available: "let-given/dist/jasmine", "let-given/dist/mocha", "let-given/dist/jest"

interface Given {
  name: string
  userParams: object
  user: User
}

const { letGiven, it } = useGiven<Given>();

describe("User", () => {
  letGiven("user", ({ userParams }) => User.create(userParams), ["userParams"])
  letGiven("userParams", ({ name }) => ({ name }), ["name"]);

  letGiven("name", () => "John");

  it("successful save", ({ user, key }) => {
    expect(user.isPersisted).toBeTruthy();
    expect(user.name).toEqual("John");
  });
});
```

The type of each context variable is described in the interface, which is passed in the useGiven parameters. If you try to define an undeclared let-given variable, or use an undeclared variable as a dependency, the typescript will throw an error


### Asynchronous functions

You can pass an asynchronous function to letGiven. In this case, let-given will wait for the resolution of the promise and in function  where this variable is used, the value of the result of this promise will be used.
This avoids await async hell in code

```js
letGiven("key", async function ({ userParams }) {
  const secret = await File.load('key.pem');
  const keyGenerator = new KeyGenerator(secret);
  return await keyGenerator.create();
});

it("successful save", ({ key }) => {
  expect(typeof key).toEqual('string');
});
```

### Super variables

letGiven allows you to specify the same variable as a dependency. In this case, the value of the same variable declared above in the test suite will be passed to the function
```js
letGiven("name", () => "John");
describe("with last name", () => {
  letGiven("name", ({ name }) => `${name} Pavlov`, ['name']);

  it("successful save", function ({ name }) {
    expect(name).toEqual("John Pavlov");
  });
});
```

### Custom "it" wrap

If you are using a testing framework other than ([mocha][mocha], [jasmine][jasmine] and [jest][jest]), then you can use  useGivenWithWrapper to wrap any "it" functions

```js
const { letGiven, test, it } = useGivenWithWrapper({
  test: test,
  it: it
});
```
useGivenWithWrapper will return the wrapped functions in the same fields in which they were passed in the parameters

## Alternatives

There are several work packages that implement context variables
- [bdd-lazy-var](https://github.com/stalniy/bdd-lazy-var)
- [Given2](https://github.com/tatyshev/given2)
- [givens](https://github.com/enova/givens)
- [jest-rspec-style](https://github.com/alfa-jpn/jest-rspec-style)

Some of them have more functionality than let-given. However, they are most often badly typed. And they all don't support asynchronous functions

## Benefits of using letGiven

let-given implements context variables similar to let! variables in rspec. Brings all their advantages and takes into account the specifics of javascript and typescript.

These are a few advantages of using the rspec approach for context creation:

### Don't repeat yourself

let-given makes it possible to describe only that part of the context that is directly relevant to the test. No need to call fixtures at the beginning of each assertation

### Test order

Run tests in any order. Context variables exist for only one test. No more dependency on test order

### No more global leaks

let-given clears variables after each test. No need to worry about clearing variables between tests

### Optimal context build time

Define context variables and their dependencies. let-given take care to prepare the context as quickly as possible

## Contributing

You can create issues on github with a description of the issue.
You can also create a pull request with fixes.
It is important that all tests are passed on the pull request branch.

There are two test folders here: dev and dist
- dev tests are designed to test functionality at the development stage
- dist tests to test an already compiled distribution.

```bash
npm run test
```
Run only dev tests.

```bash
npm run build
npm run test:dist
```
Run dist test

## License

[MIT License](http://www.opensource.org/licenses/MIT)

[mocha]: https://mochajs.org
[jasmine]: https://jasmine.github.io/2.0/introduction.html
[jest]: https://facebook.github.io/jest/docs/en/getting-started.html
[contributing]: https://github.com/Ymaril/let-given/blob/master/CONTRIBUTING.md