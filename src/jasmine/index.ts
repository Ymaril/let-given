import { baseUseGiven } from "../useGiven";
import itWrapper, { JasmineWrappedItScope } from "./itWrapper";

export default function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, JasmineWrappedItScope<T>>(itWrapper);
}