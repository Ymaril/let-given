import { baseUseGiven } from "../useGiven";
import itWrapper, { JestWrappedItScope } from "./itWrapper";

export default function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, JestWrappedItScope<T>>(itWrapper);
}
