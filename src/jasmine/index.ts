import baseUseGiven from "../useGiven";
import { JasmineWrappedItScope } from "./wrapIt";

export default function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, JasmineWrappedItScope<T>>();
}