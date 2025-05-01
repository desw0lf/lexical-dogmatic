import React from "react";
import en from "./en.json";

type TFunction<N, TKPrefix> = (key: string | string[], defaultValue?: string | Record<string, string>) => string;

export interface WithTranslation<N = any, TKPrefix = any> {
  t: TFunction<N, TKPrefix>;
}

function get(obj: any, path: string): string | undefined {
  return path.split(".").reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
}

const t: TFunction<any, any> = (key, b) => {
  const isObj = typeof b !== null && typeof b === "object";
  const { context, ...custom } = isObj ? b : {};
  const k = isObj && context ? `${key}_${context}` : key as string;
  const value = get(en, k) ?? k;
  const keys = Object.keys(custom);
  return keys.length > 0 ? value.replace(`{{${keys[0]}}}`, custom[keys[0]]) : value;
};

export function withTranslation<N = any, _TKPrefix = any>(_ns?: N): <P>(Component: React.ComponentType<P & { t: typeof t }>) => React.FC<P> {
  return function <P>(Component: React.ComponentType<P & { t: typeof t }>): React.FC<P> {
    return function Wrapper(props: P) {
      return <Component {...props} t={t} />;
    };
  };
}