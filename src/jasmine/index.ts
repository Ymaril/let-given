import { baseUseGiven } from "..";
import itWrapper, { JasmineWrappedItScope } from "./itWrapper";

export function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, JasmineWrappedItScope<T>>(itWrapper);
}

export default useGiven;
