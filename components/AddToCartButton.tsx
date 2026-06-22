"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "./Button";
import { useCart } from "./CartContext";
import type { Product } from "@/lib/database.types";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    add({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      unit_price_usd: product.price_usd,
      image: product.images?.[0],
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  if (!product.in_stock) {
    return (
      <Button variant="secondary" size="lg" fullWidth disabled>
        Agotado
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      onClick={handleClick}
      leadingIcon={
        justAdded ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />
      }
    >
      {justAdded ? "Añadido al carrito" : "Añadir al Carrito"}
    </Button>
  );
}
