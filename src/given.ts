interface GivenData<T> {
  func: Function,
  value?: any,
  isLoaded: boolean,
  dependencies: T[]
}

export default class Given<T extends Record<string, any>> {
  private data: Record<
    keyof Partial<T>, 
    GivenData<keyof Partial<T>>
  > = {} as Record<
    keyof Partial<T>,
    GivenData<keyof Partial<T>>
  >;

  public add<
    K extends keyof Partial<T>,
    D extends keyof Partial<T>
  >(key: K, func: (...args: T[D][]) => T[K] | Promise<T[K]>, dependencies: D[] = []) {
    this.data[key] = {
      func,
      isLoaded: false,
      dependencies
    }
  }

  public async get(key: keyof Partial<T>) {
    const data = this.data[key];

    if(data.isLoaded)
      return data.value;

    const args = [];
    for(let dependecy_key of data.dependencies) {
      args.push(await this.get(dependecy_key));
    }

    const value: any = await Promise.resolve(data.func(...args));

    data.isLoaded = true;
    data.value = value;

    return value;
  }

  public clear() {
    this.data = {} as Record<keyof Partial<T>, GivenData<keyof Partial<T>>>;
  }

  public async loadValues() {
    const result: Partial<T> = {} as Partial<T>;

    for(let key in this.data) {
      result[key] = await this.get(key);
    }

    return result;
  }
}