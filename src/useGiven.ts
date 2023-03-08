import currentTestFramework, { TestFramework } from "./currentTestFramework";
import Given from "./given";
import jasmineWrapIt from "./jasmine/wrapIt";
import mochaWrapIt from "./mocha/wrapIt";
import jestWrapIt from "./jest/wrapIt";

function getWrappedItScope<T extends Record<string, any>>(given: Given<T>) {
  switch(currentTestFramework()) {
    case TestFramework.jasmine:
      return jasmineWrapIt(given);
    case TestFramework.mocha:
      return mochaWrapIt(given);
    case TestFramework.jest:
      return jestWrapIt(given);
  }
}

export function useGiven<T extends Record<string, any>, K = ReturnType<typeof getWrappedItScope>>() {
  const given = new Given<T>();

  return {
    letGiven<
      K extends keyof Partial<T>,
      D extends keyof Partial<T>
    >(key: K, func: (...args: T[D][]) => T[K] | Promise<T[K]>, dependencies: D[] = [])  {
      beforeEach(() => {
        given.add(key, func, dependencies);
      });
    },
    ...getWrappedItScope(given) as K
  }
}

export default useGiven;