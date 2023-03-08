import Given from "../given";
import baseItWrapper from "../itWrapper";

type JasmineWrappedImplementationCallback<T extends Record<string, any>> =
  (given: Partial<T>, ...args: any) => void | PromiseLike<any>;

export interface JasmineWrappedItScope<T extends Record<string, any>> {
  /**
   * Define a single spec. A spec should contain one or more expectations that test the state of the code.
   * A spec whose expectations all succeed will be passing and a spec with any failures will fail.
   * @param expectation Textual description of what this spec is checking
   * @param assertion Function that contains the code of your test. If not provided the test will be pending.
   * @param timeout Custom timeout for an async spec.
   */
  it(expectation: string, assertion?: JasmineWrappedImplementationCallback<T>, timeout?: number): void;

  /**
  * A focused `it`. If suites or specs are focused, only those that are focused will be executed.
  * @param expectation Textual description of what this spec is checking
  * @param assertion Function that contains the code of your test. If not provided the test will be pending.
  * @param timeout Custom timeout for an async spec.
  */
  fit(expectation: string, assertion?: JasmineWrappedImplementationCallback<T>, timeout?: number): void;

  /**
  * A temporarily disabled `it`. The spec will report as pending and will not be executed.
  * @param expectation Textual description of what this spec is checking
  * @param assertion Function that contains the code of your test. If not provided the test will be pending.
  * @param timeout Custom timeout for an async spec.
  */
  xit(expectation: string, assertion?: JasmineWrappedImplementationCallback<T>, timeout?: number): void;
}

export default function itWrapper<T extends Record<string, any>>(given: Given<T>) {
  return {
    it: baseItWrapper(global.it, given),
    fit: baseItWrapper(global.fit, given),
    xit: baseItWrapper(global.xit, given)
  } as JasmineWrappedItScope<T>
}