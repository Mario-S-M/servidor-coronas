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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [editedNombre, setEditedNombre] = useState("");
  const [editedTelefono, setEditedTelefono] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newTelefono, setNewTelefono] = useState("");

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

  const handleNewPhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setNewTelefono(formatted);
  };

  const handleAddCustomer = async () => {
    if (!newNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const phoneNumbers = newTelefono.replace(/\D/g, "");
    if (phoneNumbers.length !== 10) {
      toast.error("El teléfono debe tener 10 dígitos");
      return;
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newNombre.trim(),
          telefono: phoneNumbers,
        }),
      });

      if (response.ok) {
        const createdCustomer = await response.json();
        setCustomers([createdCustomer, ...customers]);
        toast.success("Cliente registrado correctamente");
        setIsAddDialogOpen(false);
        setNewNombre("");
        setNewTelefono("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al registrar el cliente");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al registrar el cliente");
    }
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
      <div className="min-h-screen bg-white dark:bg-black p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 text-black dark:text-white">
            Clientes Mayoreo
          </h1>
          <div className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-black dark:text-white" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black dark:text-white">
                  Clientes Mayoreo
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                  Historial de compras de clientes mayoristas
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-xs sm:text-sm"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Registrar Cliente
            </Button>
          </div>
        </div>

        {customers.length === 0 ? (
          <Card className="border-black dark:border-white bg-white dark:bg-black">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                No hay clientes registrados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {customers.map((customer) => (
              <Card
                key={customer.id}
                className="hover:shadow-lg transition-shadow border-black dark:border-white bg-white dark:bg-black"
              >
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg text-black dark:text-white">
                        {customer.nombre}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                        {formatPhoneNumber(customer.telefono)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        Cliente desde:{" "}
                        {new Date(customer.createdAt).toLocaleDateString(
                          "es-MX"
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs whitespace-nowrap bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
                      >
                        {customer.sales.length} compras
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(customer)}
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-900"
                        >
                          <Pencil className="h-3 w-3 text-black dark:text-white" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(customer)}
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-semibold text-xs sm:text-sm md:text-base text-black dark:text-white">
                          Total gastado:
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                        ${getTotalGastado(customer.sales).toFixed(2)}
                      </span>
                    </div>

                    {customer.sales.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                          Últimas compras:
                        </p>
                        <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                          {customer.sales.slice(0, 5).map((sale) => (
                            <div
                              key={sale.id}
                              className="flex justify-between items-center text-xs sm:text-sm border-b border-gray-200 dark:border-gray-800 pb-2"
                            >
                              <div>
                                <p className="font-medium text-black dark:text-white">
                                  {sale.ticketNumber}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
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
                              <span className="font-semibold text-black dark:text-white text-xs sm:text-sm">
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

        {/* Diálogo para agregar nuevo cliente */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md border-black dark:border-white bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg text-black dark:text-white">
                Registrar Nuevo Cliente
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 block text-black dark:text-white">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm sm:text-base bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Ingrese el nombre"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 block text-black dark:text-white">
                  Teléfono *
                </label>
                <input
                  type="text"
                  value={newTelefono}
                  onChange={(e) => handleNewPhoneChange(e.target.value)}
                  className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm sm:text-base bg-white dark:bg-black text-black dark:text-white"
                  placeholder="XX-XX-XX-XX-XX"
                  maxLength={14}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Formato: XX-XX-XX-XX-XX (10 dígitos)
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewNombre("");
                  setNewTelefono("");
                }}
                size="sm"
                className="text-xs sm:text-sm border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddCustomer}
                size="sm"
                className="text-xs sm:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Registrar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md border-black dark:border-white bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg text-black dark:text-white">
                Editar Cliente
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 block text-black dark:text-white">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={editedNombre}
                  onChange={(e) => setEditedNombre(e.target.value)}
                  className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm sm:text-base bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Ingrese el nombre"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 block text-black dark:text-white">
                  Teléfono *
                </label>
                <input
                  type="text"
                  value={editedTelefono}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm sm:text-base bg-white dark:bg-black text-black dark:text-white"
                  placeholder="XX-XX-XX-XX-XX"
                  maxLength={14}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Formato: XX-XX-XX-XX-XX (10 dígitos)
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                size="sm"
                className="text-xs sm:text-sm border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveEdit}
                size="sm"
                className="text-xs sm:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md border-black dark:border-white bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg text-black dark:text-white">
                Eliminar Cliente
              </DialogTitle>
            </DialogHeader>
            <div className="py-3 sm:py-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                ¿Está seguro de que desea eliminar al cliente{" "}
                <span className="font-semibold text-black dark:text-white">
                  {selectedCustomer?.nombre}
                </span>
                ?
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                size="sm"
                className="text-xs sm:text-sm border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                size="sm"
                className="text-xs sm:text-sm bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
