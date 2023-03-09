import Given from "../Given";
import baseItWrapper from "../itWrapper";

type JestWrappedProvidesCallback<T extends Record<string, any>> =
  (given: Partial<T>, ...args: any) => void | PromiseLike<any>;

interface WrappedJestIt<T extends Record<string, any>> {
  /**
   * Creates a test closure.
   *
   * @param name The name of your test
   * @param fn The function for your test
   * @param timeout The timeout for an async function test
   */
  (name: string, fn?: JestWrappedProvidesCallback<T>, timeout?: number): void;
  /**
   * Only runs this test in the current file.
   */
  only: (name: string, fn?: JestWrappedProvidesCallback<T>, timeout?: number) => void;
  /**
   * Mark this test as expecting to fail.
   *
   * Only available in the default `jest-circus` runner.
   */
  failing: (name: string, fn?: JestWrappedProvidesCallback<T>, timeout?: number) => void;
  /**
   * Skips running this test in the current file.
   */
  skip: (name: string, fn?: JestWrappedProvidesCallback<T>, timeout?: number) => void;
  /**
   * Sketch out which tests to write in the future.
   */
  todo: (name: string, fn?: JestWrappedProvidesCallback<T>, timeout?: number) => void;
  /**
   * Experimental and should be avoided.
   */
  concurrent: (name: string, fn?: JestWrappedProvidesCallback<T>, timeout?: number) => void;
  /**
   * Use if you keep duplicating the same test with different data. `.each` allows you to write the
   * test once and pass data in.
   *
   * `.each` is available with two APIs:
   *
   * #### 1  `test.each(table)(name, fn)`
   *
   * - `table`: Array of Arrays with the arguments that are passed into the test fn for each row.
   * - `name`: String the title of the test block.
   * - `fn`: Function the test to be ran, this is the function that will receive the parameters in each row as function arguments.
   *
   *
   * #### 2  `test.each table(name, fn)`
   *
   * - `table`: Tagged Template Literal
   * - `name`: String the title of the test, use `$variable` to inject test data into the test title from the tagged template expressions.
   * - `fn`: Function the test to be ran, this is the function that will receive the test data object..
   *
   * @example
   *
   * // API 1
   * test.each([[1, 1, 2], [1, 2, 3], [2, 1, 3]])(
   *   '.add(%i, %i)',
   *   (a, b, expected) => {
   *     expect(a + b).toBe(expected);
   *   },
   * );
   *
   * // API 2
   * test.each`
   * a    | b    | expected
   * ${1} | ${1} | ${2}
   * ${1} | ${2} | ${3}
   * ${2} | ${1} | ${3}
   * `('returns $expected when $a is added $b', ({a, b, expected}) => {
   *    expect(a + b).toBe(expected);
   * });
   *
   */
  each: jest.Each;
}

export interface JestWrappedItScope<T extends Record<string, any>> {
  it: WrappedJestIt<T>;
  fit: WrappedJestIt<T>;
  xit: WrappedJestIt<T>;
  test: WrappedJestIt<T>;
  xtest: WrappedJestIt<T>;
}

export default function itWrapper<T extends Record<string, any>>(given: Given<T>) {
  const globalCopy = global as any;

  return ['it', 'fit', 'xit', 'test', 'xtest'].reduce((acc, functionName) => {
    acc[functionName] = baseItWrapper(globalCopy[functionName], given);
    
    ['only', 'failing', 'skip', 'todo', 'concurrent'].forEach(secondLevelFunctionName => {
      acc[functionName][secondLevelFunctionName] = baseItWrapper(globalCopy[functionName][secondLevelFunctionName], given);
    });

    return acc;
  }, {} as Record<string, any>) as JestWrappedItScope<T>
}