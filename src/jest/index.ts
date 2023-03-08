import baseUseGiven from "../useGiven";
import { JestWrappedItScope } from "./wrapIt";

export default function useGiven<T extends Record<string, any>>() {
  return baseUseGiven<T, JestWrappedItScope<T>>();
}