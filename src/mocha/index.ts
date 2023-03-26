import { baseUseGiven } from "..";
import itWrapper, { MochaWrappedItScope } from "./itWrapper";

export function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, MochaWrappedItScope<T>>(itWrapper);
}

export default useGiven;