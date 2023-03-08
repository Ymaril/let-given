export enum TestFramework {
  jest, jasmine, mocha
}

export default function currentTestFramework() {
  if(typeof jest !== 'undefined') {
    return TestFramework.jest;
  }
  else if(global.jasmine) {
    return TestFramework.jasmine;
  }
  else if('run' in global) {
    return TestFramework.mocha;
  }
  else {
    throw 'Unable to detect testing framework';
  }
}