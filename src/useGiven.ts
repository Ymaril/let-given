import currentTestFramework, { TestFramework } from "./currentTestFramework";
import Given from "./Given";
import jasmineItWrapper from "./jasmine/itWrapper";
import mochaItWrapper from "./mocha/itWrapper";
import jestItWrapper from "./jest/itWrapper";
import baseItWrapper from "./itWrapper";

function getItWrapper() {
  switch(currentTestFramework()) {
    case TestFramework.jasmine:
      return jasmineItWrapper;
    case TestFramework.mocha:
      return mochaItWrapper;
    case TestFramework.jest:
      return jestItWrapper;
  }
}

export function baseUseGiven<T extends Record<string, any>, K>(itWrapper: (given: Given<T>) => K) {
  const given = new Given<T>();

  return {
    letGiven<
      K extends keyof Partial<T>,
      D extends keyof Partial<T>
    >(key: K, func: (given: Record<D, T[D]>) => (T[K] | Promise<T[K]>), dependencies: D[] = [])  {
      beforeEach(() => {
        given.add(key, func, dependencies);
      });
    },
    ...itWrapper(given)
  }
}

function itToBeWrapper<X extends Record<string, Function>>(toBeWrapped: X) {
  return function itWrapper<T extends Record<string, any>>(given: Given<T>) {
    const result = {} as Record<string, any>;

    for(let toBeWrappedKey in toBeWrapped) {
      result[toBeWrappedKey] = baseItWrapper(toBeWrapped[toBeWrappedKey], given);
    }

    return result as Record<keyof X, ReturnType<typeof baseItWrapper>>;
  }
}

export function useGivenWithWrapper<T extends Record<string, any>, K extends Record<string, Function>>(toBeWrapped: K) {
  const itWrapper = itToBeWrapper(toBeWrapped);

  return baseUseGiven<T, ReturnType<typeof itWrapper>>(itWrapper);
}

export function useGiven<T extends Record<string, any>>() {
  const itWrapper = getItWrapper();

  return baseUseGiven<T, ReturnType<typeof itWrapper>>(itWrapper);
}

export default useGiven;