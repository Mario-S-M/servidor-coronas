"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus } from "lucide-react";
import { useProductStore, StoreMode } from "@/lib/store";

interface ProductCounterProps {
  productId: string;
  nombre: string;
}

export function ProductCounter({ productId, nombre }: ProductCounterProps) {
  const { getProductById, updateProductCount, mode } = useProductStore();
  const product = getProductById(productId);
  const count = product?.cantidad || 0;
  const precio = product
    ? mode === StoreMode.MENUDEO
      ? product.precioMenudeo
      : product.precioMayoreo
    : 0;

  const increment = () => {
    updateProductCount(productId, count + 1);
  };

  const decrement = () => {
    updateProductCount(productId, Math.max(0, count - 1));
  };

  const total = count * precio;

  return (
    <Card className="w-full">
      <CardContent className="p-3 lg:p-4">
        <div className="flex items-center justify-between gap-3 lg:gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm lg:text-lg truncate">
              {nombre}
            </h3>
            <div className="flex items-center gap-2 lg:gap-3 mt-1">
              <p className="text-xs lg:text-base text-muted-foreground">
                ${precio.toFixed(2)}
              </p>
              {count > 0 && (
                <span className="text-xs lg:text-base font-semibold">
                  Total: ${total.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={decrement}
              disabled={count === 0}
              className="h-8 w-8 lg:h-9 lg:w-9"
            >
              <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
            </Button>

            <span className="text-base lg:text-lg font-semibold min-w-[2.5rem] lg:min-w-[3rem] text-center">
              {count}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={increment}
              className="h-8 w-8 lg:h-9 lg:w-9"
            >
              <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
