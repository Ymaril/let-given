interface GivenData<T> {
  func: Function,
  value?: any,
  isLoaded: boolean,
  dependencies: T[],
  promise?: Promise<any>
}

export default class Given<T extends Record<string, any>> {
  private data: Record<
    keyof Partial<T>, 
    Array<GivenData<keyof Partial<T>>>
  > = {} as Record<
    keyof Partial<T>,
    Array<GivenData<keyof Partial<T>>>
  >;

  public add<
    K extends keyof Partial<T>,
    D extends keyof Partial<T>
  >(key: K, func: (given: Record<D, T[D]>) => (T[K] | Promise<T[K]>), dependencies: D[] = []) {
    if(this.isCircularDependency(key, dependencies.filter(d => key as any !== d as any)))
      throw `letGiven '${String(key)}' circular dependency`;
    
    if(!this.data[key])
      this.data[key] = [];

    this.data[key].push({
      func,
      isLoaded: false,
      dependencies
    });
  }

  private isCircularDependency(checkedKey: keyof Partial<T>, currentDependencies: Array<keyof Partial<T>>) {
    if(currentDependencies.includes(checkedKey))
      return true;

    for(let dependency of currentDependencies) {
      if(this.isCircularDependency(checkedKey, this.getAllDependencies(dependency))) {
        return true;
      }
    }

    return false;
  }

  private getAllDependencies(key: keyof Partial<T>) {
    if(!this.data[key])
      return [];

    return this.data[key].reduce((acc, currentValue) => {
      return acc.concat(
        currentValue.dependencies.filter(el => !acc.includes(el) && el !== key)
      );
    }, [] as Array<keyof Partial<T>>)
  }

  public get(key: keyof Partial<T>, level?: number) {
    if(!this.data[key])
      return Promise.resolve(undefined)

    if(typeof level === 'undefined')
      level = this.data[key].length - 1;

    const data = this.data[key][level];

    if(data.isLoaded) {
      return Promise.resolve(data.value);
    }
    else if(data.promise) {
      return data.promise;
    }

    const dependencyPromises: Promise<any>[] = data.dependencies.map(dependecy_key =>
      this
        .get(dependecy_key, dependecy_key === key ? level! - 1 : undefined)
        .then((v: any) => ([dependecy_key, v]))
    );

    data.promise = Promise.all(dependencyPromises).then(value =>
      value.reduce((acc, currentValue) => {
        acc[currentValue[0] as keyof T] = currentValue[1];

        return acc;
      }, {} as Partial<T>)
    ).then(given => Promise.resolve(data.func(given)))
      .then(value => {
        data.value = value
        data.isLoaded = true;

        return value;
      })

    return data.promise;
  }

  public clear() {
    this.data = {} as Record<keyof Partial<T>, Array<GivenData<keyof Partial<T>>>>;
  }

  public async loadValues() {
    const result: Partial<T> = {} as Partial<T>;

    for(let key in this.data) {
      result[key] = await this.get(key);
    }

    return result;
  }
}