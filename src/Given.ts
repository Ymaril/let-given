interface GivenData<T> {
  func: Function,
  value?: any,
  isLoaded: boolean,
  dependencies: T[]
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
  >(key: K, func: (...args: T[D][]) => T[K] | Promise<T[K]>, dependencies: D[] = []) {
    if(!this.data[key])
      this.data[key] = [];

    this.data[key].push({
      func,
      isLoaded: false,
      dependencies
    });
  }

  public async get(key: keyof Partial<T>, level?: number) {
    if(typeof level === 'undefined')
      level = this.data[key].length - 1;

    const data = this.data[key][level];

    if(data.isLoaded)
      return data.value;

    const given: Partial<T> = {} as Partial<T>;
    for(let dependecy_key of data.dependencies) {
      if(dependecy_key === key) {
        given[dependecy_key] = await this.get(dependecy_key, level - 1);
      }
      else {
        given[dependecy_key] = await this.get(dependecy_key);
      }
    }

    const value: any = await Promise.resolve(data.func(given));

    data.isLoaded = true;
    data.value = value;

    return value;
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