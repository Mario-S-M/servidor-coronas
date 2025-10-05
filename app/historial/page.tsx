"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Receipt, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  ticketNumber: string;
  type: string;
  total: number;
  totalItems: number;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
  items?: SaleItem[];
}

interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precioMenudeo: number;
  precioMayoreo: number;
  precioProduccion: number;
}

export default function HistorialPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedItems, setEditedItems] = useState<SaleItem[]>([]);
  const [editedType, setEditedType] = useState<string>("menudeo");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, productsRes] = await Promise.all([
          fetch("/api/sales"),
          fetch("/api/products"),
        ]);

        if (salesRes.ok) {
          const data = await salesRes.json();
          const salesWithNumbers = data.map((sale: Sale) => ({
            ...sale,
            total:
              typeof sale.total === "number" ? sale.total : Number(sale.total),
            items: sale.items?.map((item: SaleItem) => ({
              ...item,
              unitPrice:
                typeof item.unitPrice === "number"
                  ? item.unitPrice
                  : Number(item.unitPrice),
              totalPrice:
                typeof item.totalPrice === "number"
                  ? item.totalPrice
                  : Number(item.totalPrice),
            })),
          }));
          setSales(salesWithNumbers);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewTicket = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDialogOpen(true);
  };

  const handleEditTicket = (sale: Sale) => {
    setSelectedSale(sale);
    setEditedType(sale.type);
    setEditedItems(sale.items || []);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTicket = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSale) return;

    try {
      const response = await fetch(`/api/sales/${selectedSale.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSales(sales.filter((s) => s.id !== selectedSale.id));
        toast.success("Venta eliminada correctamente");
        setIsDeleteDialogOpen(false);
        setSelectedSale(null);
      } else {
        toast.error("Error al eliminar la venta");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la venta");
    }
  };

  const saveEdit = async () => {
    if (!selectedSale) return;

    const total = editedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalItems = editedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    try {
      const response = await fetch(`/api/sales/${selectedSale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editedType,
          total,
          totalItems,
          items: editedItems,
        }),
      });

      if (response.ok) {
        const updatedSale = await response.json();
        setSales(
          sales.map((s) =>
            s.id === selectedSale.id
              ? {
                  ...updatedSale,
                  total: Number(updatedSale.total),
                  items: updatedSale.items?.map((item: SaleItem) => ({
                    ...item,
                    unitPrice: Number(item.unitPrice),
                    totalPrice: Number(item.totalPrice),
                  })),
                }
              : s
          )
        );
        toast.success("Venta actualizada correctamente");
        setIsEditDialogOpen(false);
        setSelectedSale(null);
      } else {
        toast.error("Error al actualizar la venta");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar la venta");
    }
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setEditedItems(
      editedItems.map((item) => {
        if (item.id === itemId) {
          const totalPrice = item.unitPrice * newQuantity;
          return { ...item, quantity: newQuantity, totalPrice };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setEditedItems(editedItems.filter((item) => item.id !== itemId));
  };

  const updateItemPrice = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newPrice =
      editedType === "menudeo"
        ? product.precioMenudeo
        : editedType === "mayoreo"
        ? product.precioMayoreo
        : product.precioProduccion;

    setEditedItems(
      editedItems.map((item) => {
        if (item.id === itemId) {
          const totalPrice = newPrice * item.quantity;
          return { ...item, unitPrice: newPrice, totalPrice };
        }
        return item;
      })
    );
  };

  const handleTypeChange = (newType: string) => {
    setEditedType(newType);
    editedItems.forEach((item) => {
      updateItemPrice(item.id, item.productId);
    });
  };

  // Filtrar ventas según el término de búsqueda
  const filteredSales = sales.filter((sale) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();

    // Buscar por ID del ticket
    if (sale.ticketNumber.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Buscar por nombre del cliente
    if (
      sale.customerName &&
      sale.customerName.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Historial de Ventas
          </h1>
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Historial de Ventas
        </h1>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por ID de ticket o nombre del cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredSales.length} resultado
              {filteredSales.length !== 1 ? "s" : ""} encontrado
              {filteredSales.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {filteredSales.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron ventas que coincidan con la búsqueda"
                  : "No hay ventas registradas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <Card key={sale.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {sale.ticketNumber}
                    </CardTitle>
                    <Badge
                      variant={
                        sale.type === "menudeo" ? "default" : "secondary"
                      }
                    >
                      {sale.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 space-y-1">
                      {sale.customerName && (
                        <p className="text-sm font-semibold text-foreground">
                          {sale.customerName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {sale.totalItems} artículo
                        {sale.totalItems !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-2xl font-bold">
                        ${sale.total.toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(sale)}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTicket(sale)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTicket(sale)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalle del Ticket</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="text-xl font-bold">Coronas PEKKA</h3>
                  <p className="text-sm text-muted-foreground">
                    Ticket {selectedSale.ticketNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedSale.createdAt).toLocaleDateString(
                      "es-MX",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                {/* Información del cliente */}
                {(selectedSale.customerName || selectedSale.customerPhone) && (
                  <div className="border-b pb-4 space-y-2">
                    <h4 className="font-semibold text-sm">Cliente:</h4>
                    {selectedSale.customerName && (
                      <p className="text-sm">{selectedSale.customerName}</p>
                    )}
                    {selectedSale.customerPhone && (
                      <p className="text-sm text-muted-foreground">
                        {selectedSale.customerPhone}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedSale.type === "menudeo"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedSale.type.toUpperCase()}
                    </Badge>
                  </div>

                  {selectedSale.items && selectedSale.items.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Productos:</h4>
                      <div className="space-y-2">
                        {selectedSale.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm border-b pb-2"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x ${item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="font-semibold">
                              ${item.totalPrice.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total de artículos:
                    </span>
                    <span className="font-medium">
                      {selectedSale.totalItems}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${selectedSale.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Ticket</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="text-xl font-bold">Coronas PEKKA</h3>
                  <p className="text-sm text-muted-foreground">
                    Ticket {selectedSale.ticketNumber}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold">
                      Tipo de venta:
                    </label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={
                          editedType === "menudeo" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleTypeChange("menudeo")}
                      >
                        Menudeo
                      </Button>
                      <Button
                        variant={
                          editedType === "mayoreo" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleTypeChange("mayoreo")}
                      >
                        Mayoreo
                      </Button>
                      <Button
                        variant={
                          editedType === "produccion" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleTypeChange("produccion")}
                      >
                        Producción
                      </Button>
                    </div>
                  </div>

                  {editedItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Productos:</h4>
                      <div className="space-y-2">
                        {editedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 border p-2 rounded"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {item.productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${item.unitPrice.toFixed(2)} c/u
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateItemQuantity(item.id, item.quantity - 1)
                                }
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateItemQuantity(item.id, item.quantity + 1)
                                }
                              >
                                +
                              </Button>
                            </div>
                            <div className="w-20 text-right font-semibold">
                              ${item.totalPrice.toFixed(2)}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editedItems.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No hay productos en esta venta
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total de artículos:
                    </span>
                    <span className="font-medium">
                      {editedItems.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      $
                      {editedItems
                        .reduce((sum, item) => sum + item.totalPrice, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={saveEdit}
                    disabled={editedItems.length === 0}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de Confirmación de Eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar esta venta?
                </p>
                <div className="border p-4 rounded space-y-2">
                  <p className="font-semibold">{selectedSale.ticketNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSale.totalItems} artículo
                    {selectedSale.totalItems !== 1 ? "s" : ""}
                  </p>
                  <p className="text-lg font-bold">
                    ${selectedSale.total.toFixed(2)}
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
                  <Button variant="destructive" onClick={confirmDelete}>
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
