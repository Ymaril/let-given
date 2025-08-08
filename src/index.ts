import currentTestFramework, { TestFramework } from "./currentTestFramework";
import Given from "./Given";
import jasmineItWrapper from "./jasmine/itWrapper";
import mochaItWrapper from "./mocha/itWrapper";
import jestItWrapper from "./jest/itWrapper";
import baseItWrapper from "./itWrapper";

// Symbol for attaching metadata to suite contexts
const SUITE_METADATA_SYMBOL = Symbol.for('__letGiven_suiteMetadata');

interface SuiteContext {
  parent?: SuiteContext;
  variables: Map<string, VariableDefinition<any>>;
  children: Set<SuiteContext>;
}

interface VariableDefinition<T> {
  key: string;
  func: Function;
  dependencies: string[];
  value?: T;
  isEvaluated: boolean;
  promise?: Promise<T>;
}

class SuiteTracker {
  private contextStack: SuiteContext[] = [];
  private rootContext: SuiteContext;
  private originalDescribe: any;

  constructor() {
    this.rootContext = {
      variables: new Map(),
      children: new Set()
    };
    this.contextStack.push(this.rootContext);
    this.wrapDescribe();
  }

  private wrapDescribe() {
    // Store reference to original describe function
    this.originalDescribe = (global as any).describe;
    
    if (!this.originalDescribe) {
      throw new Error('Global describe function not found. Make sure you are running in a test environment.');
    }

    // Replace global describe with our wrapper
    (global as any).describe = this.createDescribeWrapper();
    
    // Also wrap context and fdescribe/xdescribe if they exist
    if ((global as any).context) {
      (global as any).context = this.createDescribeWrapper();
    }
    if ((global as any).fdescribe) {
      (global as any).fdescribe = this.createDescribeWrapper(true);
    }
    if ((global as any).xdescribe) {
      (global as any).xdescribe = this.createDescribeWrapper(false, true);
    }
  }

  private createDescribeWrapper(focused = false, skipped = false) {
    const tracker = this;
    
    return function wrappedDescribe(title: string, fn: () => void, ...args: any[]) {
      return tracker.originalDescribe(title, function(this: any) {
        // Create new suite context
        const suiteContext: SuiteContext = {
          parent: tracker.getCurrentContext(),
          variables: new Map(),
          children: new Set()
        };

        // Add to parent's children
        const parentContext = tracker.getCurrentContext();
        if (parentContext) {
          parentContext.children.add(suiteContext);
        }

        // Attach metadata to suite object (this)
        if (this && typeof this === 'object') {
          (this as any)[SUITE_METADATA_SYMBOL] = suiteContext;
        }

        // Push new context to stack
        tracker.contextStack.push(suiteContext);

        try {
          // Execute the suite definition function
          fn.call(this);
        } finally {
          // Pop context from stack
          tracker.contextStack.pop();
        }
      }, ...args);
    };
  }

  getCurrentContext(): SuiteContext {
    return this.contextStack[this.contextStack.length - 1];
  }

  getCurrentlyDefinedSuite(): SuiteContext {
    return this.getCurrentContext();
  }

  addVariable<T>(key: string, func: Function, dependencies: string[] = []): void {
    const currentContext = this.getCurrentContext();
    
    // Check for duplicate variable definition in same context
    if (currentContext.variables.has(key)) {
      throw new Error(`Cannot define "${key}" variable twice in the same suite.`);
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(key, dependencies, currentContext)) {
      throw new Error(`letGiven '${key}' circular dependency`);
    }

    const variableDefinition: VariableDefinition<T> = {
      key,
      func,
      dependencies,
      isEvaluated: false
    };

    currentContext.variables.set(key, variableDefinition);
  }

  private hasCircularDependency(key: string, dependencies: string[], context: SuiteContext): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkDependency = (varKey: string, currentContext: SuiteContext): boolean => {
      if (recursionStack.has(varKey)) {
        return true; // Circular dependency found
      }
      
      if (visited.has(varKey)) {
        return false; // Already checked this variable
      }

      visited.add(varKey);
      recursionStack.add(varKey);

      // Find variable definition in current context or parent contexts
      const varDef = this.findVariableDefinition(varKey, currentContext);
      if (varDef) {
        for (const dep of varDef.dependencies) {
          if (checkDependency(dep, currentContext)) {
            return true;
          }
        }
      }

      recursionStack.delete(varKey);
      return false;
    };

    // Check if any dependency creates a circular reference back to the key
    for (const dep of dependencies) {
      if (dep === key || checkDependency(dep, context)) {
        return true;
      }
    }

    return false;
  }

  private findVariableDefinition(key: string, context: SuiteContext): VariableDefinition<any> | undefined {
    // Look in current context first
    if (context.variables.has(key)) {
      return context.variables.get(key);
    }

    // Look in parent contexts
    if (context.parent) {
      return this.findVariableDefinition(key, context.parent);
    }

    return undefined;
  }

  getVariable<T>(key: string, context?: SuiteContext): Promise<T> {
    const targetContext = context || this.getCurrentContext();
    const varDef = this.findVariableDefinition(key, targetContext);

    if (!varDef) {
      return Promise.resolve(undefined as any);
    }

    if (varDef.isEvaluated) {
      return Promise.resolve(varDef.value);
    }

    if (varDef.promise) {
      return varDef.promise;
    }

    // Evaluate dependencies first
    const dependencyPromises = varDef.dependencies.map(depKey => 
      this.getVariable(depKey, targetContext).then(value => [depKey, value])
    );

    varDef.promise = Promise.all(dependencyPromises)
      .then(dependencies => {
        const dependencyMap = dependencies.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as any);

        return Promise.resolve(varDef.func(dependencyMap));
      })
      .then(value => {
        varDef.value = value;
        varDef.isEvaluated = true;
        return value;
      });

    return varDef.promise;
  }

  loadAllVariables(context?: SuiteContext): Promise<Record<string, any>> {
    const targetContext = context || this.getCurrentContext();
    const allVariables = this.getAllVariableKeys(targetContext);

    const variablePromises = allVariables.map(key =>
      this.getVariable(key, targetContext).then(value => [key, value])
    );

    return Promise.all(variablePromises).then(results =>
      results.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>)
    );
  }

  private getAllVariableKeys(context: SuiteContext): string[] {
    const keys = new Set<string>();
    
    // Collect keys from current context and all parent contexts
    let currentContext: SuiteContext | undefined = context;
    while (currentContext) {
      for (const key of currentContext.variables.keys()) {
        keys.add(key);
      }
      currentContext = currentContext.parent;
    }

    return Array.from(keys);
  }

  clearVariables(context?: SuiteContext): void {
    const targetContext = context || this.getCurrentContext();
    
    // Clear evaluated values and promises, but keep definitions
    for (const varDef of targetContext.variables.values()) {
      varDef.isEvaluated = false;
      varDef.value = undefined;
      varDef.promise = undefined;
    }

    // Also clear child contexts
    for (const childContext of targetContext.children) {
      this.clearVariables(childContext);
    }
  }
}

// Global suite tracker instance
let globalSuiteTracker: SuiteTracker | null = null;

function getSuiteTracker(): SuiteTracker {
  if (!globalSuiteTracker) {
    globalSuiteTracker = new SuiteTracker();
  }
  return globalSuiteTracker;
}

function getItWrapper() {
  switch (currentTestFramework()) {
    case TestFramework.jasmine:
      return jasmineItWrapper;
    case TestFramework.mocha:
      return mochaItWrapper;
    case TestFramework.jest:
      return jestItWrapper;
  }
}

export function baseUseGiven<T extends Record<string, any>, K>(
  itWrapper: (given: Given<T>) => K
) {
  const given = new Given<T>();

  afterEach(() => given.clear());

  return {
    letGiven<K extends keyof Partial<T>, D extends keyof Partial<T> = never>(
      key: K,
      func: (given: Record<D, T[D]>) => T[K] | Promise<T[K]>,
      dependencies: D[] = []
    ) {
      beforeEach(() => {
        given.add(key, func, dependencies);
      });
    },
    ...itWrapper(given),
  };
}

function itToBeWrapper<X extends Record<string, Function>>(toBeWrapped: X) {
  return function itWrapper<T extends Record<string, any>>(given: Given<T>) {
    const result = {} as Record<string, any>;

    for (let toBeWrappedKey in toBeWrapped) {
      result[toBeWrappedKey] = baseItWrapper(
        toBeWrapped[toBeWrappedKey],
        given
      );
    }

    return result as Record<keyof X, ReturnType<typeof baseItWrapper>>;
  };
}

export function useGivenWithWrapper<
  T extends Record<string, any>,
  K extends Record<string, Function>
>(toBeWrapped: K) {
  const itWrapper = itToBeWrapper(toBeWrapped);

  return baseUseGiven<T, ReturnType<typeof itWrapper>>(itWrapper);
}

export function useGiven<T extends Record<string, any>>() {
  const itWrapper = getItWrapper();

  return baseUseGiven<T, ReturnType<typeof itWrapper>>(itWrapper);
}

export default useGiven;

