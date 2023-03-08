import baseUseGiven from "../useGiven";
import { MochaWrappedItScope } from "./wrapIt";

export default function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, MochaWrappedItScope<T>>();
}