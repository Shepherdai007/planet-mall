// context/CartContext.tsx
// ─── GLOBAL CART STATE ──────────────────────────────────────────
// Persists in localStorage. Cleared on checkout.
// Import useCart() hook instead of consuming context directly.

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";

export interface CartItem {
  productId:  string;
  shopId:     string;
  shopName:   string;
  name:       string;
  image:      string;
  price:      number;
  quantity:   number;
  currency:   "CAD" | "USD" | "EUR" | "GBP";
}

interface CartState {
  items:      CartItem[];
  isOpen:     boolean;
}

type CartAction =
  | { type: "ADD_ITEM";    item: CartItem }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QTY";  productId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "LOAD";        items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD":
      return { ...state, items: action.items };

    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.productId === action.item.productId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.productId),
      };

    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };

    case "CLEAR":
      return { ...state, items: [] };

    case "OPEN_CART":
      return { ...state, isOpen: true };

    case "CLOSE_CART":
      return { ...state, isOpen: false };

    default:
      return state;
  }
}

interface CartContextValue {
  items:       CartItem[];
  isOpen:      boolean;
  itemCount:   number;
  subtotal:    number;
  addItem:     (item: CartItem) => void;
  removeItem:  (productId: string) => void;
  updateQty:   (productId: string, quantity: number) => void;
  clearCart:   () => void;
  openCart:    () => void;
  closeCart:   () => void;
}

const CartContext = createContext<CartContextValue>({} as CartContextValue);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pm_cart");
      if (saved) dispatch({ type: "LOAD", items: JSON.parse(saved) });
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("pm_cart", JSON.stringify(state.items));
  }, [state.items]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal  = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items:      state.items,
        isOpen:     state.isOpen,
        itemCount,
        subtotal,
        addItem:    (item) => dispatch({ type: "ADD_ITEM", item }),
        removeItem: (id)   => dispatch({ type: "REMOVE_ITEM", productId: id }),
        updateQty:  (id, q) => dispatch({ type: "UPDATE_QTY", productId: id, quantity: q }),
        clearCart:  ()     => dispatch({ type: "CLEAR" }),
        openCart:   ()     => dispatch({ type: "OPEN_CART" }),
        closeCart:  ()     => dispatch({ type: "CLOSE_CART" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
