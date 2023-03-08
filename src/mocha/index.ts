import { baseUseGiven } from "../useGiven";
import itWrapper, { MochaWrappedItScope } from "./itWrapper";

export default function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, MochaWrappedItScope<T>>(itWrapper);
}