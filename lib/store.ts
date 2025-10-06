import { create } from "zustand";

export interface ProductItem {
  id: string;
  nombre: string;
  precioMenudeo: number;
  precioMayoreo: number;
  precioProduccion: number;
  categoria: string;
  cantidad: number;
}

export enum StoreMode {
  MENUDEO = "menudeo",
  MAYOREO = "mayoreo",
}

interface ProductStore {
  products: ProductItem[];
  mode: StoreMode;
  customerName: string;
  customerPhone: string;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  updateProductCount: (productId: string, newCount: number) => void;
  getProductById: (productId: string) => ProductItem | undefined;
  getProductsByCategory: (categoria: string) => ProductItem[];
  getCategories: () => string[];
  getTotalItems: () => number;
  getTotalAmount: () => number;
  getTicketItems: () => Array<{
    nombre: string;
    precio: number;
    cantidad: number;
    total: number;
  }>;
  resetAllProducts: () => void;
  setMode: (mode: StoreMode) => void;
  saveSale: () => Promise<void>;
  loadProductsFromDB: () => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  mode: StoreMode.MENUDEO,
  customerName: "",
  customerPhone: "",

  setCustomerName: (name: string) => set({ customerName: name }),
  setCustomerPhone: (phone: string) => set({ customerPhone: phone }),

  updateProductCount: (productId: string, newCount: number) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? { ...product, cantidad: Math.max(0, newCount) }
          : product
      ),
    })),

  getProductById: (productId: string) => {
    return get().products.find((product) => product.id === productId);
  },

  getProductsByCategory: (categoria: string) => {
    return get().products.filter((product) => product.categoria === categoria);
  },

  getCategories: () => {
    const categories = new Set(get().products.map((p) => p.categoria));
    return Array.from(categories).sort();
  },

  getTotalItems: () => {
    return get().products.reduce(
      (total, product) => total + product.cantidad,
      0
    );
  },

  getTotalAmount: () => {
    const { products, mode } = get();
    return products.reduce((total, product) => {
      const precio =
        mode === StoreMode.MENUDEO
          ? product.precioMenudeo
          : product.precioMayoreo;
      return total + product.cantidad * precio;
    }, 0);
  },

  getTicketItems: () => {
    const { products, mode } = get();
    return products.map((product) => {
      const precio =
        mode === StoreMode.MENUDEO
          ? product.precioMenudeo
          : product.precioMayoreo;
      return {
        nombre: product.nombre,
        precio: precio,
        cantidad: product.cantidad,
        total: product.cantidad * precio,
      };
    });
  },

  resetAllProducts: () =>
    set((state) => ({
      products: state.products.map((product) => ({
        ...product,
        cantidad: 0,
      })),
      customerName: "",
      customerPhone: "",
    })),

  setMode: (mode: StoreMode) => set({ mode }),

  saveSale: async () => {
    const {
      products,
      mode,
      getTotalAmount,
      getTotalItems,
      customerName,
      customerPhone,
    } = get();
    const itemsWithQuantity = products.filter(
      (product) => product.cantidad > 0
    );

    if (itemsWithQuantity.length === 0) return;

    // Validación para mayoreo: nombre y teléfono son obligatorios
    if (mode === StoreMode.MAYOREO) {
      if (!customerName || !customerName.trim()) {
        const { toast } = await import("sonner");
        toast.error("Error", {
          description:
            "El nombre del cliente es obligatorio para ventas de mayoreo",
        });
        return;
      }
      const phoneNumbers = customerPhone.replace(/\D/g, "");
      if (!phoneNumbers || phoneNumbers.length !== 10) {
        const { toast } = await import("sonner");
        toast.error("Error", {
          description:
            "El teléfono debe tener 10 dígitos para ventas de mayoreo",
        });
        return;
      }
    }

    // Remover formato del teléfono antes de enviar
    const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, "") : null;

    try {
      const saleData = {
        ticketNumber: `#${String(Date.now()).slice(-6)}`,
        type: mode,
        total: getTotalAmount(),
        totalItems: getTotalItems(),
        customerName:
          mode === StoreMode.MAYOREO && customerName
            ? customerName
            : customerName || null,
        customerPhone:
          mode === StoreMode.MAYOREO && cleanPhone
            ? cleanPhone
            : cleanPhone || null,
        items: itemsWithQuantity.map((product) => ({
          productId: product.id,
          productName: product.nombre,
          quantity: product.cantidad,
          unitPrice:
            mode === StoreMode.MENUDEO
              ? product.precioMenudeo
              : product.precioMayoreo,
          totalPrice:
            product.cantidad *
            (mode === StoreMode.MENUDEO
              ? product.precioMenudeo
              : product.precioMayoreo),
        })),
      };

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        console.log("Venta guardada exitosamente");
        const { toast } = await import("sonner");
        toast.success("Venta guardada exitosamente");
      } else {
        const errorData = await response.json();
        console.error("Error al guardar la venta:", errorData);
        const { toast } = await import("sonner");
        toast.error("Error al guardar la venta", {
          description: errorData.error || "Error desconocido",
        });
      }
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      const { toast } = await import("sonner");
      toast.error("Error al guardar la venta", {
        description: "No se pudo conectar con el servidor",
      });
    }
  },

  loadProductsFromDB: async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const dbProducts = await response.json();
        const products = dbProducts.map(
          (product: {
            id: string;
            nombre: string;
            precioMenudeo: number;
            precioMayoreo: number;
            precioProduccion: number;
            categoria: string;
          }) => ({
            id: product.id,
            nombre: product.nombre,
            precioMenudeo: Number(product.precioMenudeo),
            precioMayoreo: Number(product.precioMayoreo),
            precioProduccion: Number(product.precioProduccion),
            categoria: product.categoria,
            cantidad: 0,
          })
        );
        set({ products });
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      // Fallback con productos estáticos
      const fallbackProducts = [
        {
          id: "corona-ramo",
          nombre: "Corona de Ramo",
          precioMenudeo: 25.5,
          precioMayoreo: 20.0,
          precioProduccion: 15.0,
          categoria: "coronas",
          cantidad: 0,
        },
        {
          id: "corona-grande",
          nombre: "Corona grande con imagen",
          precioMenudeo: 20.0,
          precioMayoreo: 16.0,
          precioProduccion: 12.0,
          categoria: "coronas",
          cantidad: 0,
        },
        {
          id: "corona-mediana",
          nombre: "Corona mediana con imagen",
          precioMenudeo: 20.0,
          precioMayoreo: 16.0,
          precioProduccion: 12.0,
          categoria: "coronas",
          cantidad: 0,
        },
        {
          id: "corona-pequeña",
          nombre: "Corona pequeña con imagen",
          precioMenudeo: 20.0,
          precioMayoreo: 16.0,
          precioProduccion: 12.0,
          categoria: "coronas",
          cantidad: 0,
        },
        {
          id: "cruz-grande",
          nombre: "Cruz grande",
          precioMenudeo: 25.5,
          precioMayoreo: 20.0,
          precioProduccion: 15.0,
          categoria: "cruces",
          cantidad: 0,
        },
        {
          id: "cruz-mediana",
          nombre: "Cruz mediana",
          precioMenudeo: 20.0,
          precioMayoreo: 16.0,
          precioProduccion: 12.0,
          categoria: "cruces",
          cantidad: 0,
        },
        {
          id: "cruz-pequeña",
          nombre: "Cruz pequeña",
          precioMenudeo: 20.0,
          precioMayoreo: 16.0,
          precioProduccion: 12.0,
          categoria: "cruces",
          cantidad: 0,
        },
        {
          id: "arco-grande",
          nombre: "Arco grande",
          precioMenudeo: 25.5,
          precioMayoreo: 20.0,
          precioProduccion: 15.0,
          categoria: "arcos",
          cantidad: 0,
        },
        {
          id: "arco-mediano",
          nombre: "Arco mediano",
          precioMenudeo: 20.0,
          precioMayoreo: 16.0,
          precioProduccion: 12.0,
          categoria: "arcos",
          cantidad: 0,
        },
        {
          id: "arco-pequeño",
          nombre: "Arco pequeño",
          precioMenudeo: 20.0,
          precioMayoreo: 16.0,
          precioProduccion: 12.0,
          categoria: "arcos",
          cantidad: 0,
        },
      ];
      set({ products: fallbackProducts });
    }
  },
}));
