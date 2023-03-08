import Given from "../given";
import { itWrapper } from "../itWrapper";
import baseUseGiven from "../useGiven";

export interface MochaWrappedItScope<T extends Record<string, any>> {
  it: {
    /**
     * [bdd, tdd] Describe a "suite" with the given `title` and callback `fn` containing
     * nested suites.
     *
     * - _Only available when invoked via the mocha CLI._
     */
    (title: string, fn: (this: Mocha.Suite, given: Partial<T>) => void): Mocha.Suite;
    /**
     * [qunit] Describe a "suite" with the given `title`.
     *
     * - _Only available when invoked via the mocha CLI._
     */
    (title: string): Mocha.Suite;
    /**
     * [bdd, tdd, qunit] Indicates this suite should be executed exclusively.
     *
     * - _Only available when invoked via the mocha CLI._
     */
    only: {
      /**
       * [bdd, tdd] Describe a "suite" with the given `title` and callback `fn` containing
       * nested suites. Indicates this suite should be executed exclusively.
       *
       * - _Only available when invoked via the mocha CLI._
       */
      (title: string, fn: (this: Mocha.Suite, given: Partial<T>) => void): Mocha.Suite;
      /**
       * [qunit] Describe a "suite" with the given `title`. Indicates this suite should be executed
       * exclusively.
       *
       * - _Only available when invoked via the mocha CLI._
       */
      (title: string): Mocha.Suite;
    };
    /**
     * [bdd, tdd] Indicates this suite should not be executed.
     *
     * - _Only available when invoked via the mocha CLI._
     */
    skip: {
      (title: string, fn: (this: Mocha.Suite, given: Partial<T>) => void): Mocha.Suite | void;
    };
  }
}

export default function wrapIt<T extends Record<string, any>>(given: Given<T>) {
  const originalIt = global.it as unknown as Mocha.SuiteFunction;

  const result = {} as Record<string, any>;

  result['it'] = itWrapper(originalIt, given);
  result['it']['only'] = itWrapper(originalIt.only, given);
  result['it']['skip'] = itWrapper(originalIt.skip, given);

  return result as MochaWrappedItScope<T>;
}