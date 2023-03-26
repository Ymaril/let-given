import { baseUseGiven } from "..";
import itWrapper, { JestWrappedItScope } from "./itWrapper";

export function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, JestWrappedItScope<T>>(itWrapper);
}

export default useGiven;
