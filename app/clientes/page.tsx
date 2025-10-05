"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Phone,
  ShoppingBag,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/utils";

interface Sale {
  id: string;
  ticketNumber: string;
  total: number;
  createdAt: string;
}

interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  createdAt: string;
  sales: Sale[];
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [editedNombre, setEditedNombre] = useState("");
  const [editedTelefono, setEditedTelefono] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalGastado = (sales: Sale[]) => {
    return sales.reduce((sum, sale) => sum + sale.total, 0);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setEditedTelefono(formatted);
  };

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditedNombre(customer.nombre);
    setEditedTelefono(formatPhoneNumber(customer.telefono));
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedCustomer) return;

    if (!editedNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const phoneNumbers = editedTelefono.replace(/\D/g, "");
    if (phoneNumbers.length !== 10) {
      toast.error("El teléfono debe tener 10 dígitos");
      return;
    }

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editedNombre.trim(),
          telefono: phoneNumbers,
        }),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomers(
          customers.map((c) =>
            c.id === selectedCustomer.id ? { ...c, ...updatedCustomer } : c
          )
        );
        toast.success("Cliente actualizado correctamente");
        setIsEditDialogOpen(false);
        setSelectedCustomer(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al actualizar el cliente");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el cliente");
    }
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCustomers(customers.filter((c) => c.id !== selectedCustomer.id));
        toast.success("Cliente eliminado correctamente");
        setIsDeleteDialogOpen(false);
        setSelectedCustomer(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al eliminar el cliente");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el cliente");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Clientes Mayoreo
          </h1>
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Clientes Mayoreo
              </h1>
              <p className="text-gray-600">
                Historial de compras de clientes mayoristas
              </p>
            </div>
          </div>
        </div>

        {customers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No hay clientes registrados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customers.map((customer) => (
              <Card
                key={customer.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg">
                        {customer.nombre}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {formatPhoneNumber(customer.telefono)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Cliente desde:{" "}
                        {new Date(customer.createdAt).toLocaleDateString(
                          "es-MX"
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary">
                        {customer.sales.length} compras
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(customer)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(customer)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold">Total gastado:</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        ${getTotalGastado(customer.sales).toFixed(2)}
                      </span>
                    </div>

                    {customer.sales.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Últimas compras:
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {customer.sales.slice(0, 5).map((sale) => (
                            <div
                              key={sale.id}
                              className="flex justify-between items-center text-sm border-b pb-2"
                            >
                              <div>
                                <p className="font-medium">
                                  {sale.ticketNumber}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(sale.createdAt).toLocaleDateString(
                                    "es-MX",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                              <span className="font-semibold text-gray-700">
                                ${sale.total.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Diálogo de edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={editedNombre}
                  onChange={(e) => setEditedNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Ingrese el nombre"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Teléfono *
                </label>
                <input
                  type="text"
                  value={editedTelefono}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="XX-XX-XX-XX-XX"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: XX-XX-XX-XX-XX (10 dígitos)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={saveEdit}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Cliente</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                ¿Está seguro de que desea eliminar al cliente{" "}
                <span className="font-semibold text-foreground">
                  {selectedCustomer?.nombre}
                </span>
                ?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
