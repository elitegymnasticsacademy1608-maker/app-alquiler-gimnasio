"use client";

import { useMemo, useState } from "react";
import { IconoSearch, IconoTrend, IconoWallet } from "./icons";

type Usuario = {
  id: string;
  nombre: string;
  telefono?: string | null;
  tipo_usuario?: string | null;
};

type Registro = {
  id: string;
  usuario_id: string | null;
  monto_generado: number;
  estado_pago: string;
  metodo_pago: string | null;
  cantidad_atletas: number;
  fecha_asistencia: string;
  usuarios_externos?: {
    nombre?: string | null;
    telefono?: string | null;
    tipo_usuario?: string | null;
  } | null;
};

type HistorialPerfilesProps = {
  usuarios: Usuario[];
  registros: Registro[];
  clasesRestantesPaquete: Record<string, number>;
  formatearFechaConDia: (fecha: string) => string;
};

type ResumenPerfil = {
  id: string;
  nombre: string;
  telefono: string;
  tipo: string;
  entradas: number;
  totalPagado: number;
  deuda: number;
  ultimaEntrada: string | null;
  primeraDeuda: string | null;
  clasesRestantes: number;
  registros: Registro[];
};

const COP = new Intl.NumberFormat("es-CO");

export function HistorialPerfiles({ usuarios, registros, clasesRestantesPaquete, formatearFechaConDia }: HistorialPerfilesProps) {
  const [busqueda, setBusqueda] = useState("");
  const [perfilActivo, setPerfilActivo] = useState<ResumenPerfil | null>(null);

  const resumenes = useMemo(() => {
    return usuarios.map((usuario) => {
      const historial = registros
        .filter((registro) => registro.usuario_id === usuario.id)
        .sort((a, b) => new Date(b.fecha_asistencia).getTime() - new Date(a.fecha_asistencia).getTime());

      const entradas = historial.filter((registro) => Number(registro.cantidad_atletas) > 0).length;
      const totalPagado = historial
        .filter((registro) => registro.estado_pago === "Pagado")
        .reduce((sum, registro) => sum + Number(registro.monto_generado), 0);
      const pendientes = historial.filter((registro) => registro.estado_pago === "Pendiente");
      const deuda = pendientes.reduce((sum, registro) => sum + Number(registro.monto_generado), 0);
      const ultimaEntrada = historial.find((registro) => Number(registro.cantidad_atletas) > 0)?.fecha_asistencia || null;
      const primeraDeuda = pendientes
        .sort((a, b) => new Date(a.fecha_asistencia).getTime() - new Date(b.fecha_asistencia).getTime())[0]?.fecha_asistencia || null;

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        telefono: usuario.telefono || "Sin contacto",
        tipo: usuario.tipo_usuario || "Sin tipo",
        entradas,
        totalPagado,
        deuda,
        ultimaEntrada,
        primeraDeuda,
        clasesRestantes: clasesRestantesPaquete[usuario.id] || 0,
        registros: historial,
      };
    }).sort((a, b) => b.entradas - a.entradas || b.totalPagado - a.totalPagado);
  }, [usuarios, registros, clasesRestantesPaquete]);

  const perfilesFiltrados = resumenes.filter((perfil) => {
    const texto = `${perfil.nombre} ${perfil.telefono} ${perfil.tipo}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const totalEntradas = resumenes.reduce((sum, perfil) => sum + perfil.entradas, 0);
  const totalPagado = resumenes.reduce((sum, perfil) => sum + perfil.totalPagado, 0);
  const totalDeuda = resumenes.reduce((sum, perfil) => sum + perfil.deuda, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Historial de Perfiles</h2>
          <p className="text-gray-400 font-medium mt-1">Entradas, pagos acumulados y deuda actual por persona.</p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="absolute left-4 top-3.5 text-gray-400"><IconoSearch /></span>
          <input type="text" placeholder="Buscar perfil..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:outline-none text-gray-800 bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Entradas Totales</p>
          <p className="text-3xl font-black text-blue-950">{totalEntradas}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-3xl border border-green-100 shadow-sm">
          <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">Pagado Histórico</p>
          <p className="text-3xl font-black text-green-600">${COP.format(totalPagado)}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-3xl border border-red-100 shadow-sm">
          <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-1">Deuda Activa</p>
          <p className="text-3xl font-black text-red-500">${COP.format(totalDeuda)}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Perfil</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Entradas</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Pagado</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Debe</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Última</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {perfilesFiltrados.map((perfil) => (
                <tr key={perfil.id} onClick={() => setPerfilActivo(perfil)} className="hover:bg-blue-50/40 transition-colors cursor-pointer">
                  <td className="p-5">
                    <p className="font-bold text-gray-800">{perfil.nombre}</p>
                    <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{perfil.telefono} • {perfil.tipo}</p>
                    {perfil.clasesRestantes > 0 && <span className="mt-2 inline-block bg-green-100 text-green-700 font-black text-[10px] px-2 py-1 rounded-lg">{perfil.clasesRestantes} clases en paquete</span>}
                  </td>
                  <td className="p-5 text-center text-blue-600 font-black text-xl">{perfil.entradas}</td>
                  <td className="p-5 text-right text-green-600 font-black">${COP.format(perfil.totalPagado)}</td>
                  <td className="p-5 text-right">
                    <p className={`font-black ${perfil.deuda > 0 ? "text-red-500" : "text-gray-300"}`}>${COP.format(perfil.deuda)}</p>
                    {perfil.primeraDeuda && <p className="text-[10px] text-red-400 font-bold mt-1">Desde {formatearFechaConDia(perfil.primeraDeuda)}</p>}
                  </td>
                  <td className="p-5 text-right text-gray-500 font-bold capitalize">{perfil.ultimaEntrada ? formatearFechaConDia(perfil.ultimaEntrada) : "-"}</td>
                </tr>
              ))}
              {perfilesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">No encontré perfiles con esa búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {perfilActivo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button type="button" onClick={() => setPerfilActivo(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 outline-none">Cerrar</button>
            <div className="mb-6 pr-16">
              <h3 className="text-2xl font-black text-gray-800">{perfilActivo.nombre}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{perfilActivo.telefono} • {perfilActivo.tipo}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100"><IconoTrend /><p className="text-xs font-bold text-blue-500 mt-3">Entradas</p><p className="text-2xl font-black text-blue-950">{perfilActivo.entradas}</p></div>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100"><IconoWallet /><p className="text-xs font-bold text-green-600 mt-3">Pagado</p><p className="text-2xl font-black text-green-600">${COP.format(perfilActivo.totalPagado)}</p></div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100"><IconoWallet /><p className="text-xs font-bold text-red-500 mt-3">Debe</p><p className="text-2xl font-black text-red-500">${COP.format(perfilActivo.deuda)}</p></div>
            </div>

            <div className="border border-gray-100 rounded-3xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Movimientos recientes</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto custom-scrollbar">
                {perfilActivo.registros.map((registro) => (
                  <div key={registro.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-700 capitalize">{formatearFechaConDia(registro.fecha_asistencia)}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{Number(registro.cantidad_atletas) > 0 ? "Entrada a entrenar" : "Movimiento de pago"} • {registro.metodo_pago || "Pendiente"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${registro.estado_pago === "Pagado" ? "text-green-600" : "text-red-500"}`}>${COP.format(Number(registro.monto_generado))}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{registro.estado_pago}</p>
                    </div>
                  </div>
                ))}
                {perfilActivo.registros.length === 0 && <p className="p-8 text-center text-gray-400 font-medium">Este perfil aún no tiene movimientos.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
