import Given from "../src/given";

let given: Given;
const unWrappedIt = global['it']; 

const mGlobal = global as any;

beforeEach(() => {
  given = new Given();
});


type ImplementationCallback = ((givens: object) => PromiseLike<any>) | ((givens: object, done?: DoneFn) => void);
declare global {
  function letGiven(key: string, func: Function, dependencies?: string[]): void;
  function getGiven(key: string): any;
  function it(expectation: string, assertion?: ImplementationCallback, timeout?: number | undefined): void;
}

mGlobal.letGiven = function letGiven(key: string, func: Function, dependencies: string[] = []) {
  beforeEach(() => {
    given.add(key, func, dependencies);
  });
}
mGlobal.getGiven = async function letGiven(key: string) {
  return await given.get(key);
}

function itWrapper(expectation: string, assertion?: ImplementationCallback, timeout?: number | undefined) {
  if((assertion || []).length > 1) {
    unWrappedIt(expectation, async (done: DoneFn) => {
      const givens = await given.loadValues();
  
      if(assertion) { 
        await Promise.resolve(assertion(givens, done));
      }
      
      given.clear();
    }, timeout);
  }
  else {
    unWrappedIt(expectation, async () => {
      const givens = await given.loadValues();
  
      if(assertion) { 
        await Promise.resolve((assertion as (givens: object) => void)(givens));
      }
      
      given.clear();
    }, timeout);
  }
}

mGlobal['it'] = itWrapper;

global = mGlobal;