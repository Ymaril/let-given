// Symbol for attaching metadata to suite contexts
const VARIABLE_METADATA_SYMBOL = Symbol.for('__letGiven_variableMetadata');

/**
 * Represents a single variable definition with its metadata
 */
export interface VariableDefinition<T = any> {
  key: string;
  func: (dependencies: Record<string, any>) => T | Promise<T>;
  dependencies: string[];
  value?: T;
  isEvaluated: boolean;
  promise?: Promise<T>;
  context: any; // The suite context where this variable was defined
}

/**
 * Manages variable definitions and their hierarchical relationships
 */
export class VariableMetadata {
  private variables: Map<string, VariableDefinition> = new Map();
  private aliases: Map<string, string> = new Map();
  private parent?: VariableMetadata;
  private children: Set<VariableMetadata> = new Set();
  private context: any;

  constructor(context?: any) {
    this.context = context;
  }

  /**
   * Ensures metadata is attached to the given suite context
   */
  static ensureDefinedOn(context: any): VariableMetadata {
    if (!context) {
      throw new Error('Cannot attach metadata to undefined context');
    }

    if (!context.hasOwnProperty(VARIABLE_METADATA_SYMBOL)) {
      context[VARIABLE_METADATA_SYMBOL] = new VariableMetadata(context);
    }

    return context[VARIABLE_METADATA_SYMBOL];
  }

  /**
   * Retrieves metadata from the given context, optionally for a specific variable
   */
  static of(context: any, variableName?: string): VariableMetadata | VariableDefinition | undefined {
    if (!context) {
      return undefined;
    }

    const metadata = context[VARIABLE_METADATA_SYMBOL] as VariableMetadata;
    
    if (variableName && metadata) {
      return metadata.getVariableDefinition(variableName);
    }

    return metadata;
  }

  /**
   * Adds a variable definition to this metadata instance
   */
  addVariable<T>(
    key: string, 
    func: (dependencies: Record<string, any>) => T | Promise<T>, 
    dependencies: string[] = []
  ): this {
    // Check for duplicate variable definition in same context
    if (this.variables.has(key)) {
      throw new Error(`Cannot define "${key}" variable twice in the same suite.`);
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(key, dependencies)) {
      throw new Error(`letGiven '${key}' circular dependency`);
    }

    const variableDefinition: VariableDefinition<T> = {
      key,
      func,
      dependencies,
      isEvaluated: false,
      context: this.context
    };

    this.variables.set(key, variableDefinition);
    return this;
  }

  /**
   * Adds an alias for an existing variable
   */
  addAlias(originalName: string, aliasName: string): this {
    if (!this.variables.has(originalName)) {
      throw new Error(`Cannot create alias "${aliasName}" for undefined variable "${originalName}"`);
    }

    this.aliases.set(aliasName, originalName);
    return this;
  }

  /**
   * Establishes parent-child relationship between metadata instances
   */
  addChild(child: VariableMetadata): void {
    child.parent = this;
    this.children.add(child);
  }

  /**
   * Gets a variable definition, looking up the inheritance chain if necessary
   */
  getVariableDefinition(key: string): VariableDefinition | undefined {
    // Check for alias first
    const actualKey = this.aliases.get(key) || key;
    
    // Look in current context
    if (this.variables.has(actualKey)) {
      return this.variables.get(actualKey);
    }

    // Look in parent contexts
    if (this.parent) {
      return this.parent.getVariableDefinition(actualKey);
    }

    return undefined;
  }

  /**
   * Evaluates a variable, handling dependencies and caching
   */
  async evaluateVariable<T>(key: string): Promise<T> {
    const varDef = this.getVariableDefinition(key);
    
    if (!varDef) {
      return undefined as any;
    }

    // Return cached value if already evaluated
    if (varDef.isEvaluated) {
      return varDef.value as T;
    }

    // Return existing promise if evaluation is in progress
    if (varDef.promise) {
      return varDef.promise as Promise<T>;
    }

    // Evaluate dependencies first
    const dependencyPromises = varDef.dependencies.map(async (depKey) => {
      const depValue = await this.evaluateVariable(depKey);
      return [depKey, depValue] as [string, any];
    });

    varDef.promise = Promise.all(dependencyPromises)
      .then(dependencies => {
        // Build dependency map
        const dependencyMap = dependencies.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);

        // Call the variable function with dependencies
        return Promise.resolve(varDef.func(dependencyMap));
      })
      .then(value => {
        // Cache the result
        varDef.value = value;
        varDef.isEvaluated = true;
        return value;
      });

    return varDef.promise as Promise<T>;
  }

  /**
   * Evaluates all variables in this context and returns them as an object
   */
  async loadAllVariables(): Promise<Record<string, any>> {
    const allKeys = this.getAllVariableKeys();
    
    const variablePromises = allKeys.map(async (key) => {
      const value = await this.evaluateVariable(key);
      return [key, value] as [string, any];
    });

    const results = await Promise.all(variablePromises);
    
    return results.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Gets all variable keys available in this context (including inherited ones)
   */
  getAllVariableKeys(): string[] {
    const keys = new Set<string>();
    
    // Add keys from current context
    for (const key of this.variables.keys()) {
      keys.add(key);
    }
    
    // Add alias keys
    for (const alias of this.aliases.keys()) {
      keys.add(alias);
    }
    
    // Add keys from parent contexts
    if (this.parent) {
      const parentKeys = this.parent.getAllVariableKeys();
      parentKeys.forEach(key => keys.add(key));
    }
    
    return Array.from(keys);
  }

  /**
   * Clears all evaluated values and promises, but keeps definitions
   */
  releaseVariables(): void {
    for (const varDef of this.variables.values()) {
      varDef.isEvaluated = false;
      varDef.value = undefined;
      varDef.promise = undefined;
    }

    // Also clear child contexts
    for (const child of this.children) {
      child.releaseVariables();
    }
  }

  /**
   * Checks if a variable name refers to a specific variable (including aliases)
   */
  isVariableNamed(variableName: string, targetName: string): boolean {
    if (variableName === targetName) {
      return true;
    }

    // Check if it's an alias
    const actualKey = this.aliases.get(variableName);
    return actualKey === targetName;
  }

  /**
   * Finds the metadata context where a variable is defined
   */
  findVariableContext(key: string): VariableMetadata | undefined {
    const actualKey = this.aliases.get(key) || key;
    
    if (this.variables.has(actualKey)) {
      return this;
    }

    if (this.parent) {
      return this.parent.findVariableContext(actualKey);
    }

    return undefined;
  }

  /**
   * Checks for circular dependencies in variable definitions
   */
  private hasCircularDependency(key: string, dependencies: string[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkDependency = (varKey: string): boolean => {
      if (recursionStack.has(varKey)) {
        return true; // Circular dependency found
      }
      
      if (visited.has(varKey)) {
        return false; // Already checked this variable
      }

      visited.add(varKey);
      recursionStack.add(varKey);

      // Find variable definition
      const varDef = this.getVariableDefinition(varKey);
      if (varDef) {
        for (const dep of varDef.dependencies) {
          if (checkDependency(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(varKey);
      return false;
    };

    // Check if any dependency creates a circular reference back to the key
    for (const dep of dependencies) {
      if (dep === key || checkDependency(dep)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets the parent metadata context
   */
  getParent(): VariableMetadata | undefined {
    return this.parent;
  }

  /**
   * Gets all child metadata contexts
   */
  getChildren(): Set<VariableMetadata> {
    return new Set(this.children);
  }

  /**
   * Gets the suite context this metadata is attached to
   */
  getContext(): any {
    return this.context;
  }

  /**
   * Checks if this metadata has any variables defined
   */
  hasVariables(): boolean {
    return this.variables.size > 0;
  }

  /**
   * Gets the count of variables defined in this context (not including inherited)
   */
  getVariableCount(): number {
    return this.variables.size;
  }

  /**
   * Checks if a specific variable is defined in this context (not inherited)
   */
  hasVariable(key: string): boolean {
    const actualKey = this.aliases.get(key) || key;
    return this.variables.has(actualKey);
  }
}

export { VARIABLE_METADATA_SYMBOL };
