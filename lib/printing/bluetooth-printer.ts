// Impresión térmica por Web Bluetooth (solo BLE). Solo debe usarse en el cliente.

interface BleCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
}
interface BleService {
  getCharacteristics(): Promise<BleCharacteristic[]>;
}
interface BleServer {
  connected: boolean;
  getPrimaryServices(): Promise<BleService[]>;
  disconnect(): void;
}
interface BleDevice {
  id: string;
  name?: string;
  gatt?: { connect(): Promise<BleServer> };
}
interface BleApi {
  requestDevice(options: {
    acceptAllDevices: boolean;
    optionalServices: string[];
  }): Promise<BleDevice>;
  getDevices?: () => Promise<BleDevice[]>;
}

// Servicios BLE habituales en impresoras térmicas genéricas.
const KNOWN_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

/** El usuario cerró el selector de dispositivos sin elegir (no es un fallo). */
export class PrinterChooserCancelled extends Error {
  constructor() {
    super("Selección de impresora cancelada");
  }
}

const STORAGE_KEY = "coronas.printer";
const CHUNK_SIZE = 100;
const CHUNK_DELAY_MS = 30;

const bluetooth = (): BleApi | undefined =>
  typeof navigator === "undefined"
    ? undefined
    : (navigator as unknown as { bluetooth?: BleApi }).bluetooth;

export function isBluetoothSupported(): boolean {
  return !!bluetooth();
}

export function getSavedPrinterName(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as { name: string }).name : null;
  } catch {
    return null;
  }
}

export function forgetPrinter() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin almacenamiento disponible
  }
}

function savePrinter(device: BleDevice) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: device.id, name: device.name ?? "Impresora" })
    );
  } catch {
    // sin almacenamiento disponible
  }
}

async function findSavedDevice(): Promise<BleDevice | null> {
  const api = bluetooth();
  if (!api?.getDevices) return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const { id } = JSON.parse(saved) as { id: string };
    const devices = await api.getDevices();
    return devices.find((d) => d.id === id) ?? null;
  } catch {
    return null;
  }
}

async function pickDevice(forceChoose: boolean): Promise<BleDevice> {
  const api = bluetooth();
  if (!api) {
    throw new Error(
      "Este navegador no permite Bluetooth. Usa Chrome en Android con HTTPS."
    );
  }
  if (!forceChoose) {
    const saved = await findSavedDevice();
    if (saved) return saved;
  }
  let device: BleDevice;
  try {
    device = await api.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_SERVICES,
    });
  } catch (error) {
    // Chrome usa NotFoundError cuando se cierra el selector; solo aquí significa "cancelado"
    if (error instanceof DOMException && error.name === "NotFoundError") {
      throw new PrinterChooserCancelled();
    }
    throw error;
  }
  savePrinter(device);
  return device;
}

async function findWritable(server: BleServer): Promise<BleCharacteristic> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const chars = await service.getCharacteristics();
    const writable = chars.find(
      (c) => c.properties.writeWithoutResponse || c.properties.write
    );
    if (writable) return writable;
  }
  throw new Error(
    "La impresora no expone un canal de escritura BLE. Usa la impresión del navegador."
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// La primera conexión suele fallar: la impresora duerme o aún no publica sus canales.
const CONNECT_ATTEMPTS = 3;
const CONNECT_TIMEOUT_MS = 8000;
const SETTLE_MS = 400;
const RETRY_DELAY_MS = 600;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** Conecta y localiza el canal de escritura, reintentando mientras la impresora despierta. */
async function connectWritable(device: BleDevice) {
  if (!device.gatt) throw new Error("La impresora no admite conexión GATT");
  let lastError: unknown;
  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
    let server: BleServer | undefined;
    try {
      server = await withTimeout(
        device.gatt.connect(),
        CONNECT_TIMEOUT_MS,
        "La impresora no respondió. Revisa que esté encendida y cerca."
      );
      // Margen para que la impresora termine de despertar antes de usarla
      await sleep(SETTLE_MS);
      const characteristic = await findWritable(server);
      return { server, characteristic };
    } catch (error) {
      lastError = error;
      if (server?.connected) server.disconnect();
      if (attempt < CONNECT_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

/** Envía los bytes a la impresora. `chooseNew` abre el selector de dispositivos. */
export async function printBytes(
  data: Uint8Array,
  options: { chooseNew?: boolean } = {}
): Promise<string> {
  const device = await pickDevice(!!options.chooseNew);
  // Los reintentos son solo de conexión: una vez que se envía el primer bloque no se repite,
  // para no imprimir el ticket duplicado o a medias
  const { server, characteristic } = await connectWritable(device);
  try {
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValueWithResponse(chunk);
      }
      await sleep(CHUNK_DELAY_MS);
    }
  } finally {
    // Pequeña espera para que la impresora reciba el último bloque antes de cerrar.
    await sleep(300);
    if (server.connected) server.disconnect();
  }
  return device.name ?? "Impresora";
}
