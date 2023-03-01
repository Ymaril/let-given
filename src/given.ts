interface GivenData {
  func: Function,
  value?: any,
  isLoaded: boolean,
  dependencies: string[]
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

export default class Given {
  private data: {[key: string]: GivenData} = {};

  public add(key: string, func: Function, dependencies: string[] = []) {
    if(dependencies.length === 0) {
      dependencies = getParamNames(func);
    }
    
    this.data[key] = {
      func,
      isLoaded: false,
      dependencies
    }
  }

  public async get(key: string) {
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
    this.data = {};
  }

  public async loadValues() {
    const result: {[key: string]: any} = {};

    for(let key in this.data) {
      result[key] = await this.get(key);
    }

    return result;
  }
}