// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};



export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
};


export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};
// AGREGAR AL FINAL DEL ARCHIVO: app/lib/definitions.ts

// ============================================
// TIPOS PARA CITAS
// ============================================

export type Cita = {
  id: number;
  id_cliente: number;
  fecha: string;
  hora: string;
  descripcion: string | null;
  asistio: boolean;
  id_servicio: number | null;
};

export type CitaDetalle = {
  id: number; 
  hora: string;
  servicio: string;
  cliente: string;
  fecha: string;
  asistio: boolean | null; 
};

export type CitasAgrupadasPorDia = {
  dia: string;
  total_citas: number;
  citas: CitaDetalle[];
};

export type Cliente = {
  id: number;
  nombre: string;
  apellido: string | null;
  edad: number | null;
  numero: string | null;
  primer_mensaje: Date | null;
  ultimo_mensaje: Date | null;
  activo: boolean;
};

export type Servicio = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

export type Horario = {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_final: string;
  activo: boolean;
};



export type CitaHoy = {
  id: number;
  cliente_nombre: string;
  cliente_apellido: string;
  hora: string;
  servicio_nombre: string;
  descripcion: string;
};

export type ServicioSolicitado = {
  id: number;
  nombre: string;
  total_citas: number;
};

export type CitaEstadistica = {
  servicio: string;
  total_citas: number;
  asistieron: number;
  no_asistieron: number;
};


export type ClienteFrecuente = {
  nombre: string;
  apellido: string | null;
  total_citas: string | number;
  citas_completadas: string | number;
};

export type CrecimientoCliente = {
  mes: string;
  mes_fecha: Date;
  nuevos_clientes: string | number;
};

export type DistribucionServicio = {
  servicio: string;
  total: string | number;
  porcentaje: string | number;
};
export type HorarioPopular = {
  hora: string | number;
  total: string | number;
};