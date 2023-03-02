import Given from "./given";

export default function useGiven<T extends Record<string, any>>(
  beforeEach: Function = global.beforeEach,
  it: Function = global.it
) {
  const given = new Given<T>();

  function itWrapper(expectation: string, assertion?: (given: Partial<T>, ...args: any) => void, timeout?: number | undefined) {
    it(expectation, async (...args: any[]) => {
      const givens = await given.loadValues();
  
      if(assertion) { 
        await Promise.resolve(assertion(givens, ...args));
      }
      
      given.clear();
    }, timeout);
  }

  return {
    letGiven<
      K extends keyof Partial<T>,
      D extends keyof Partial<T>
    >(key: K, func: (...args: T[D][]) => T[K] | Promise<T[K]>, dependencies: D[] = [])  {
      beforeEach(() => {
        given.add(key, func, dependencies);
      });
    },
    async getGiven(key: keyof Partial<T>) {
      return await given.get(key);
    },
    it: itWrapper
  }
}