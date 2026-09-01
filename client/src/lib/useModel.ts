import { useCallback, useMemo, useState } from "react";

import {
  breakEvenCpa,
  marginPct,
  totalCost,
  type CalcInputs,
} from "@/lib/breakeven";

export type CalcState = {
  product: CalcInputs;
  actualCpaRaw: string;
};

export const DEFAULT_PRODUCT: CalcInputs = {
  price: 550,
  productCost: 250,
  shipping: 60,
  operating: 25,
  extra: 15,
};

export function parseCpa(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useModel(initialProduct: CalcInputs = DEFAULT_PRODUCT) {
  const [state, setState] = useState<CalcState>({
    product: initialProduct,
    actualCpaRaw: "",
  });

  const setProduct = useCallback((key: keyof CalcInputs, value: number) => {
    setState(current => ({
      ...current,
      product: { ...current.product, [key]: value },
    }));
  }, []);

  const setActualCpaRaw = useCallback((raw: string) => {
    setState(current => ({ ...current, actualCpaRaw: raw }));
  }, []);

  const model = useMemo(
    () => ({
      total: totalCost(state.product),
      be: breakEvenCpa(state.product),
      margin: marginPct(state.product),
      manualCpa: parseCpa(state.actualCpaRaw),
    }),
    [state]
  );

  return { model, state, setProduct, setActualCpaRaw };
}
