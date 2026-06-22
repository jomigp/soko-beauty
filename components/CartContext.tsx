"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  totalQty: number;
  subtotalUsd: number;
  isOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const STORAGE_KEY = "soko-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed.filter(Boolean));
      }
    } catch {
      // ignore corrupted state
    }
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // quota or disabled
    }
  }, [items, hydrated]);

  const add = useCallback((newItem: Omit<CartItem, "qty">, qty = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.product_id === newItem.product_id);
      if (existing) {
        return current.map((i) =>
          i.product_id === newItem.product_id
            ? { ...i, qty: i.qty + qty }
            : i
        );
      }
      return [...current, { ...newItem, qty }];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((current) => current.filter((i) => i.product_id !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((current) => current.filter((i) => i.product_id !== productId));
      return;
    }
    setItems((current) =>
      current.map((i) => (i.product_id === productId ? { ...i, qty } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotalUsd = items.reduce(
      (sum, i) => sum + i.unit_price_usd * i.qty,
      0
    );
    return {
      items,
      totalQty,
      subtotalUsd,
      isOpen,
      add,
      remove,
      setQty,
      clear,
      open,
      close,
      toggle,
    };
  }, [items, isOpen, add, remove, setQty, clear, open, close, toggle]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
