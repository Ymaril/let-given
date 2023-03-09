import Given from "./Given";

export default function itWrapper<T extends Record<string, any>>(it: Function, given: Given<T>) {
  return function wrappedIt(expectation: string, assertion?: (this: any, given: Partial<T>, ...args: any) => any, ...args: any[]) {
    it(expectation, async (...args: any[]) => {
      const givens = await given.loadValues();
  
      if(assertion) { 
        await Promise.resolve(assertion(givens, ...args));
      }
      
      given.clear();
    }, ...args);
  }
}