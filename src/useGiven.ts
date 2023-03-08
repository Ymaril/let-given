import Given from "./given";

function getItScope() {
  return {
    it: global.it,
    fit: global.fit,
    xit: global.xit
  }
}

interface ItScope {
  it: Function,
  fit: Function,
  xit: Function
}

export function useGiven<T extends Record<string, any>>(
  beforeEach: Function = global.beforeEach,
  itScope?: Record<string, Function>
) {
  if(!itScope)
    itScope = getItScope();

  const given = new Given<T>();

  const wrappedItScope = Object.keys(itScope).reduce((acc, key) => {
    function wrappedIt(expectation: string, assertion?: (given: Partial<T>, ...args: any) => void, timeout?: number | undefined) {
      itScope![key](expectation, async (...args: any[]) => {
        const givens = await given.loadValues();
    
        if(assertion) { 
          await Promise.resolve(assertion(givens, ...args));
        }
        
        given.clear();
      }, timeout);
    }
    
    acc[key] = wrappedIt;

    return acc; 
  }, {} as Record<string, (expectation: string, assertion?: (given: Partial<T>, ...args: any) => void, timeout?: number | undefined) => void>)

  return {
    letGiven<
      K extends keyof Partial<T>,
      D extends keyof Partial<T>
    >(key: K, func: (...args: T[D][]) => T[K] | Promise<T[K]>, dependencies: D[] = [])  {
      beforeEach(() => {
        given.add(key, func, dependencies);
      });
    },
    ...wrappedItScope as Record<keyof ItScope, (expectation: string, assertion?: (given: Partial<T>, ...args: any) => void, timeout?: number | undefined) => void>
  }
}

export default useGiven;