"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Save, Plus, Pencil, Trash2, FolderPlus } from "lucide-react";

interface Product {
  id: string;
  nombre: string;
  precioMenudeo: number;
  precioMayoreo: number;
  precioProduccion: number;
  categoria: string;
}

interface Category {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

interface ProductsByCategory {
  [key: string]: Product[];
}

export default function PreciosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    nombre: "",
    categoria: "",
    precioMenudeo: 0,
    precioMayoreo: 0,
    precioProduccion: 0,
  });
  const [newCategory, setNewCategory] = useState({ nombre: "", orden: 0 });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(
          data.map((p: Product) => ({
            ...p,
            precioMenudeo: Number(p.precioMenudeo),
            precioMayoreo: Number(p.precioMayoreo),
            precioProduccion: Number(p.precioProduccion),
          }))
        );
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0 && !newProduct.categoria) {
          setNewProduct({ ...newProduct, categoria: data[0].nombre });
        }
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      toast.error("Error al cargar categorías");
    }
  };

  const updatePrice = (
    id: string,
    field: keyof Pick<
      Product,
      "precioMenudeo" | "precioMayoreo" | "precioProduccion"
    >,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: numValue } : p))
    );
  };

  const saveAllPrices = async () => {
    setSaving(true);
    try {
      const updatePromises = products.map(async (product) => {
        const response = await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            precioMenudeo: product.precioMenudeo,
            precioMayoreo: product.precioMayoreo,
            precioProduccion: product.precioProduccion,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al actualizar ${product.nombre}`);
        }
      });

      await Promise.all(updatePromises);
      toast.success("Precios actualizados correctamente");
    } catch (error) {
      console.error("Error al guardar precios:", error);
      toast.error("Error al guardar precios");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.nombre.trim()) {
      toast.error("El nombre del producto es requerido");
      return;
    }

    if (!newProduct.categoria) {
      toast.error("La categoría es requerida");
      return;
    }

    if (
      newProduct.precioMenudeo <= 0 ||
      newProduct.precioMayoreo <= 0 ||
      newProduct.precioProduccion <= 0
    ) {
      toast.error("Los precios deben ser mayores a 0");
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const created = await response.json();
        setProducts([...products, created]);
        toast.success("Producto agregado correctamente");
        setIsAddDialogOpen(false);
        setNewProduct({
          nombre: "",
          categoria: categories.length > 0 ? categories[0].nombre : "",
          precioMenudeo: 0,
          precioMayoreo: 0,
          precioProduccion: 0,
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al agregar producto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar producto");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.nombre.trim()) {
      toast.error("El nombre de la categoría es requerido");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      if (response.ok) {
        const created = await response.json();
        setCategories([...categories, created]);
        toast.success("Categoría agregada correctamente");
        setNewCategory({ nombre: "", orden: 0 });
        loadCategories();
      } else {
        toast.error("Error al agregar categoría");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar categoría");
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editingCategory.nombre,
          orden: editingCategory.orden,
        }),
      });

      if (response.ok) {
        toast.success("Categoría actualizada correctamente");
        setEditingCategory(null);
        loadCategories();
      } else {
        toast.error("Error al actualizar categoría");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar categoría");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Categoría eliminada correctamente");
        loadCategories();
      } else {
        toast.error("Error al eliminar categoría");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar categoría");
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    if (!selectedProduct.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: selectedProduct.nombre,
          categoria: selectedProduct.categoria,
          precioMenudeo: selectedProduct.precioMenudeo,
          precioMayoreo: selectedProduct.precioMayoreo,
          precioProduccion: selectedProduct.precioProduccion,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProducts(
          products.map((p) =>
            p.id === selectedProduct.id
              ? {
                  ...updated,
                  precioMenudeo: Number(updated.precioMenudeo),
                  precioMayoreo: Number(updated.precioMayoreo),
                  precioProduccion: Number(updated.precioProduccion),
                }
              : p
          )
        );
        toast.success("Producto actualizado correctamente");
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
      } else {
        toast.error("Error al actualizar producto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar producto");
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== selectedProduct.id));
        toast.success("Producto eliminado correctamente");
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
      } else {
        toast.error("Error al eliminar producto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar producto");
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const productsByCategory: ProductsByCategory = products.reduce(
    (acc, product) => {
      if (!acc[product.categoria]) {
        acc[product.categoria] = [];
      }
      acc[product.categoria].push(product);
      return acc;
    },
    {} as ProductsByCategory
  );

  const categoryTitles: { [key: string]: string } = categories.reduce(
    (acc, cat) => {
      acc[cat.nombre] = cat.nombre;
      return acc;
    },
    {} as { [key: string]: string }
  );

  if (loading) {
    return (
      <div className="p-3 sm:p-4 bg-white dark:bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Cargando productos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-black dark:text-white" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-black dark:text-white">
                  Editar Precios
                </h1>
                <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">
                  Actualiza los precios de todos los productos
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setIsCategoryDialogOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <FolderPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Gestionar Categorías</span>
                <span className="sm:hidden">Categorías</span>
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Agregar Producto</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
              <Button
                onClick={saveAllPrices}
                disabled={saving}
                size="sm"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-6">
          {Object.entries(productsByCategory).map(
            ([categoria, categoryProducts]) => (
              <Card
                key={categoria}
                className="border-black dark:border-white bg-white dark:bg-black"
              >
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg text-black dark:text-white">
                    {categoryTitles[categoria] || categoria}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6">
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full min-w-[600px] sm:min-w-full">
                      <thead>
                        <tr className="border-b border-black dark:border-white">
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-black dark:text-white text-xs sm:text-sm">
                            Producto
                          </th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-black dark:text-white text-xs sm:text-sm">
                            P. Menudeo
                          </th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-black dark:text-white text-xs sm:text-sm">
                            P. Mayoreo
                          </th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-black dark:text-white text-xs sm:text-sm">
                            P. Producción
                          </th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-black dark:text-white text-xs sm:text-sm">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                          >
                            <td className="py-2 px-2 sm:py-3 sm:px-4">
                              <span className="font-medium text-black dark:text-white text-xs sm:text-sm">
                                {product.nombre}
                              </span>
                            </td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={product.precioMenudeo}
                                  onChange={(e) =>
                                    updatePrice(
                                      product.id,
                                      "precioMenudeo",
                                      e.target.value
                                    )
                                  }
                                  className="w-16 sm:w-24 px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-xs sm:text-sm bg-white dark:bg-black text-black dark:text-white"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={product.precioMayoreo}
                                  onChange={(e) =>
                                    updatePrice(
                                      product.id,
                                      "precioMayoreo",
                                      e.target.value
                                    )
                                  }
                                  className="w-16 sm:w-24 px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-xs sm:text-sm bg-white dark:bg-black text-black dark:text-white"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={product.precioProduccion}
                                  onChange={(e) =>
                                    updatePrice(
                                      product.id,
                                      "precioProduccion",
                                      e.target.value
                                    )
                                  }
                                  className="w-16 sm:w-24 px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-xs sm:text-sm bg-white dark:bg-black text-black dark:text-white"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4">
                              <div className="flex gap-1 sm:gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(product)}
                                  className="h-7 w-7 p-0 sm:h-9 sm:w-9 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-900"
                                >
                                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-black dark:text-white" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openDeleteDialog(product)}
                                  className="h-7 w-7 p-0 sm:h-9 sm:w-9 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Diálogo para agregar producto */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Agregar Nuevo Producto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold">
                  Nombre:
                </label>
                <input
                  type="text"
                  placeholder="ej: Corona de Ramo"
                  value={newProduct.nombre}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, nombre: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                  Categoría:
                </label>
                <Select
                  value={newProduct.categoria}
                  onValueChange={(value) =>
                    setNewProduct({
                      ...newProduct,
                      categoria: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full mt-1 text-sm sm:text-base">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nombre}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold">
                  Precio Menudeo:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.precioMenudeo}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      precioMenudeo: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold">
                  Precio Mayoreo:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.precioMayoreo}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      precioMayoreo: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold">
                  Precio Producción:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.precioProduccion}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      precioProduccion: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddProduct}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo para editar producto */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Editar Producto
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold">
                    ID:
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.id}
                    disabled
                    className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold">
                    Nombre:
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.nombre}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                    Categoría:
                  </label>
                  <Select
                    value={selectedProduct.categoria}
                    onValueChange={(value) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        categoria: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full mt-1 text-sm sm:text-base">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.nombre}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold">
                    Precio Menudeo:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedProduct.precioMenudeo}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        precioMenudeo: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold">
                    Precio Mayoreo:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedProduct.precioMayoreo}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        precioMayoreo: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold">
                    Precio Producción:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedProduct.precioProduccion}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        precioProduccion: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEditProduct}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Confirmar Eliminación
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  ¿Estás seguro de que deseas eliminar este producto?
                </p>
                <div className="border p-3 sm:p-4 rounded space-y-2">
                  <p className="font-semibold text-sm sm:text-base">
                    {selectedProduct.nombre}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ID: {selectedProduct.id}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Categoría: {selectedProduct.categoria}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-destructive">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProduct}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de gestión de categorías */}
        <Dialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Gestionar Categorías
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm sm:text-base">
                  Agregar Nueva Categoría
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la categoría"
                    value={newCategory.nombre}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, nombre: e.target.value })
                    }
                    className="flex-1 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  />
                  <input
                    type="number"
                    placeholder="Orden"
                    value={newCategory.orden}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        orden: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full sm:w-24 px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  />
                  <Button
                    onClick={handleAddCategory}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm sm:text-base">
                  Categorías Existentes
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">
                            Nombre
                          </th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">
                            Orden
                          </th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category.id} className="border-t">
                            {editingCategory?.id === category.id ? (
                              <>
                                <td className="py-2 px-2 sm:py-3 sm:px-4">
                                  <input
                                    type="text"
                                    value={editingCategory.nombre}
                                    onChange={(e) =>
                                      setEditingCategory({
                                        ...editingCategory,
                                        nombre: e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                                  />
                                </td>
                                <td className="py-2 px-2 sm:py-3 sm:px-4">
                                  <input
                                    type="number"
                                    value={editingCategory.orden}
                                    onChange={(e) =>
                                      setEditingCategory({
                                        ...editingCategory,
                                        orden: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="w-16 sm:w-20 px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                                  />
                                </td>
                                <td className="py-2 px-2 sm:py-3 sm:px-4">
                                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleEditCategory}
                                      className="text-xs h-7 sm:h-8"
                                    >
                                      Guardar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingCategory(null)}
                                      className="text-xs h-7 sm:h-8"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">
                                  {category.nombre}
                                </td>
                                <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">
                                  {category.orden}
                                </td>
                                <td className="py-2 px-2 sm:py-3 sm:px-4">
                                  <div className="flex gap-1 sm:gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setEditingCategory(category)
                                      }
                                      className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                                    >
                                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteCategory(category.id)
                                      }
                                      className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
