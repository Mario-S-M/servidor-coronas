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
      <div className="p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-gray-700" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Editar Precios
                </h1>
                <p className="text-gray-600">
                  Actualiza los precios de todos los productos
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCategoryDialogOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Gestionar Categorías
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </Button>
              <Button
                onClick={saveAllPrices}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(productsByCategory).map(
            ([categoria, categoryProducts]) => (
              <Card key={categoria}>
                <CardHeader>
                  <CardTitle>
                    {categoryTitles[categoria] || categoria}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Producto
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Precio Menudeo
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Precio Mayoreo
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Precio Producción
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-900">
                                {product.nombre}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">$</span>
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
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">$</span>
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
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">$</span>
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
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(product)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openDeleteDialog(product)}
                                >
                                  <Trash2 className="h-4 w-4" />
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Nombre:</label>
                <input
                  type="text"
                  placeholder="ej: Corona de Ramo"
                  value={newProduct.nombre}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, nombre: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Categoría:</label>
                <select
                  value={newProduct.categoria}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      categoria: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Precio Menudeo:</label>
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
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Precio Mayoreo:</label>
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
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
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
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddProduct}>Agregar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo para editar producto */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">ID:</label>
                  <input
                    type="text"
                    value={selectedProduct.id}
                    disabled
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Nombre:</label>
                  <input
                    type="text"
                    value={selectedProduct.nombre}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Categoría:</label>
                  <select
                    value={selectedProduct.categoria}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        categoria: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.nombre}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">
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
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">
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
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">
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
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleEditProduct}>Guardar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar este producto?
                </p>
                <div className="border p-4 rounded space-y-2">
                  <p className="font-semibold">{selectedProduct.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedProduct.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Categoría: {selectedProduct.categoria}
                  </p>
                </div>
                <p className="text-sm text-destructive">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteProduct}>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gestionar Categorías</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Agregar Nueva Categoría</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la categoría"
                    value={newCategory.nombre}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, nombre: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                  <Button onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Categorías Existentes</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Nombre
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Orden
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className="border-t">
                          {editingCategory?.id === category.id ? (
                            <>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={editingCategory.nombre}
                                  onChange={(e) =>
                                    setEditingCategory({
                                      ...editingCategory,
                                      nombre: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={editingCategory.orden}
                                  onChange={(e) =>
                                    setEditingCategory({
                                      ...editingCategory,
                                      orden: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleEditCategory}
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCategory(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4">{category.nombre}</td>
                              <td className="py-3 px-4">{category.orden}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingCategory(category)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteCategory(category.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
