interface GivenData<T> {
  func: Function,
  value?: any,
  isLoaded: boolean,
  dependencies: T[]
}
var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var DEFAULT_PARAMS = /=[^,]+/mg;
var FAT_ARROWS = /=>.*$/mg;

function getParamNames(fn: Function) {
  var code = fn.toString()
    .replace(COMMENTS, '')
    .replace(FAT_ARROWS, '')
    .replace(DEFAULT_PARAMS, '');

  var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
    .match(/([^\s,]+)/g);

  return result === null
    ? []
    : result;
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
    if(dependencies.length === 0) {
      dependencies = getParamNames(func) as D[];
    }

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