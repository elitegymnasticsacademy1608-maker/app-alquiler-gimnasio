"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
};

type AttendanceGridModalProps = {
  abierto: boolean;
  usuarios: Usuario[];
  registrosDelDia: Registro[];
  fechaCaja: string;
  clasesRestantesPaquete: Record<string, number>;
  entradasGratisRestantes: Record<string, number>;
  visitasPorUsuario: Record<string, number>;
  tarifaPorAtletaProfesor: number;
  onCerrar: () => void;
  onGuardado: () => void;
};

type ToastState = {
  tipo: "success" | "error";
  texto: string;
} | null;

const tarifaAtleta = 10000;

export function AttendanceGridModal({
  abierto,
  usuarios,
  registrosDelDia,
  fechaCaja,
  clasesRestantesPaquete,
  entradasGratisRestantes,
  visitasPorUsuario,
  tarifaPorAtletaProfesor,
  onCerrar,
  onGuardado,
}: AttendanceGridModalProps) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<ToastState>(null);
  const [cantidadesProfesor, setCantidadesProfesor] = useState<Record<string, number>>({});

  const registrosAsistenciaPorUsuario = useMemo(() => {
    const mapa = new Map<string, Registro>();
    registrosDelDia.forEach((registro) => {
      if (registro.usuario_id && Number(registro.cantidad_atletas) > 0) {
        mapa.set(registro.usuario_id, registro);
      }
    });
    return mapa;
  }, [registrosDelDia]);

  useEffect(() => {
    if (!abierto) return;
    setSeleccionados(new Set(registrosAsistenciaPorUsuario.keys()));
    const cantidades: Record<string, number> = {};
    usuarios.forEach((usuario) => {
      if (usuario.tipo_usuario?.trim() !== "Profesor") return;
      cantidades[usuario.id] = Math.max(1, Number(registrosAsistenciaPorUsuario.get(usuario.id)?.cantidad_atletas) || 1);
    });
    setCantidadesProfesor(cantidades);
  }, [abierto, registrosAsistenciaPorUsuario, usuarios]);

  useEffect(() => {
    if (!abierto) return;
    setBusqueda("");
    setMensaje(null);
  }, [abierto]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return usuarios
      .filter((usuario) => {
        if (!texto) return true;
        return `${usuario.nombre} ${usuario.telefono || ""} ${usuario.tipo_usuario || ""}`.toLowerCase().includes(texto);
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [usuarios, busqueda]);

  const seleccionadosIniciales = useMemo(() => new Set(registrosAsistenciaPorUsuario.keys()), [registrosAsistenciaPorUsuario]);
  const idsSeleccionados = Array.from(seleccionados);
  const idsParaAgregar = idsSeleccionados.filter((id) => !seleccionadosIniciales.has(id));
  const idsParaQuitar = Array.from(seleccionadosIniciales).filter((id) => !seleccionados.has(id));
  const usuariosPorId = useMemo(() => new Map(usuarios.map((usuario) => [usuario.id, usuario])), [usuarios]);
  const idsProfesorConCantidadEditada = idsSeleccionados.filter((id) => {
    if (!seleccionadosIniciales.has(id)) return false;
    const usuario = usuariosPorId.get(id);
    if (usuario?.tipo_usuario?.trim() !== "Profesor") return false;
    const cantidadActual = Math.max(1, Number(cantidadesProfesor[id]) || 1);
    const cantidadGuardada = Math.max(1, Number(registrosAsistenciaPorUsuario.get(id)?.cantidad_atletas) || 1);
    return cantidadActual !== cantidadGuardada;
  });
  const hayCambios = idsParaAgregar.length > 0 || idsParaQuitar.length > 0 || idsProfesorConCantidadEditada.length > 0;

  const alternarSeleccion = (id: string) => {
    setMensaje(null);
    setSeleccionados((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  };

  const ajustarCantidadProfesor = (id: string, cantidad: number) => {
    setMensaje(null);
    setCantidadesProfesor((actual) => ({
      ...actual,
      [id]: Math.max(1, Math.min(99, cantidad)),
    }));
  };

  const crearRegistro = (usuario: Usuario) => {
    const tipoUsuario = usuario.tipo_usuario?.trim() || "Gimnasta";
    const esProfesor = tipoUsuario === "Profesor";
    const clasesQueLeQuedan = clasesRestantesPaquete[usuario.id] || 0;
    const entradasGratis = entradasGratisRestantes[usuario.id] || 0;
    const usarPaquete = clasesQueLeQuedan > 0 && !esProfesor;
    const usarEntradaGratis = !usarPaquete && entradasGratis > 0 && !esProfesor;
    const visitasPrevias = visitasPorUsuario[usuario.id] || 0;
    const esCortesiaFidelidad = !esProfesor && !usarPaquete && !usarEntradaGratis && visitasPrevias % 11 === 10;

    if (usarPaquete) {
      return {
        usuario_id: usuario.id,
        cantidad_atletas: 1,
        monto_generado: 0,
        estado_pago: "Pagado",
        metodo_pago: "Uso de Paquete",
        fecha_asistencia: fechaCaja,
      };
    }

    if (usarEntradaGratis) {
      return {
        usuario_id: usuario.id,
        cantidad_atletas: 1,
        monto_generado: 0,
        estado_pago: "Pagado",
        metodo_pago: "Uso Entrada Gratis Sorteo",
        fecha_asistencia: fechaCaja,
      };
    }

    if (esCortesiaFidelidad) {
      return {
        usuario_id: usuario.id,
        cantidad_atletas: 1,
        monto_generado: 0,
        estado_pago: "Pagado",
        metodo_pago: "Cortesía Fidelidad",
        fecha_asistencia: fechaCaja,
      };
    }

    return {
      usuario_id: usuario.id,
      cantidad_atletas: esProfesor ? Math.max(1, Number(cantidadesProfesor[usuario.id]) || 1) : 1,
      monto_generado: esProfesor ? tarifaPorAtletaProfesor * (Math.max(1, Number(cantidadesProfesor[usuario.id]) || 1)) : tarifaAtleta,
      estado_pago: "Pendiente",
      metodo_pago: null,
      fecha_asistencia: fechaCaja,
    };
  };

  const guardarAsistencias = async () => {
    if (!hayCambios) return;
    setGuardando(true);
    setMensaje(null);

    try {
      const nuevosRegistros = idsParaAgregar
        .map((id) => usuariosPorId.get(id))
        .filter((usuario): usuario is Usuario => Boolean(usuario))
        .map(crearRegistro);

      if (nuevosRegistros.length > 0) {
        const { error } = await supabase.from("registro_entrenamientos").insert(nuevosRegistros);
        if (error) throw error;
      }

      if (idsParaQuitar.length > 0) {
        const idsRegistros = idsParaQuitar
          .map((id) => registrosAsistenciaPorUsuario.get(id)?.id)
          .filter((id): id is string => typeof id === "string");

        if (idsRegistros.length > 0) {
          const { error } = await supabase.from("registro_entrenamientos").delete().in("id", idsRegistros);
          if (error) throw error;
        }
      }

      for (const id of idsProfesorConCantidadEditada) {
        const registro = registrosAsistenciaPorUsuario.get(id);
        if (!registro) continue;
        const cantidad = Math.max(1, Number(cantidadesProfesor[id]) || 1);
        const { error } = await supabase
          .from("registro_entrenamientos")
          .update({
            cantidad_atletas: cantidad,
            monto_generado: tarifaPorAtletaProfesor * cantidad,
          })
          .eq("id", registro.id);
        if (error) throw error;
      }

      setMensaje({ tipo: "success", texto: `Asistencia actualizada: ${idsParaAgregar.length} agregados, ${idsParaQuitar.length} retirados, ${idsProfesorConCantidadEditada.length} cantidades ajustadas.` });
      onGuardado();
    } catch (error) {
      setMensaje({ tipo: "error", texto: `No se pudo guardar la asistencia: ${(error as Error).message}` });
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-stretch md:items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white/95 border border-white/70 shadow-2xl rounded-[2rem] w-full max-w-7xl max-h-[96vh] overflow-hidden flex flex-col">
        <div className="px-5 md:px-8 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-500">Toma de asistencia visual</p>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Selecciona quién entra a entrenar</h3>
              <p className="text-sm font-medium text-gray-400 mt-1">Puedes abrir esta pantalla después y ajustar la asistencia del día.</p>
            </div>
            <button onClick={onCerrar} className="self-end md:self-auto bg-gray-100 hover:bg-gray-200 text-gray-500 p-3 rounded-2xl transition-colors outline-none" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, teléfono o tipo..." className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-800 font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300" />
            </div>
            <div className="flex gap-2 text-sm font-black">
              <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl border border-blue-100">{seleccionados.size} seleccionados</span>
              {hayCambios && <span className="bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl border border-amber-100">{idsParaAgregar.length} nuevos / {idsParaQuitar.length} quita</span>}
            </div>
          </div>

          {mensaje && (
            <div className={`mt-4 px-4 py-3 rounded-2xl text-sm font-bold border ${mensaje.tipo === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
              {mensaje.texto}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 pb-32 bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {usuariosFiltrados.map((usuario) => {
              const seleccionado = seleccionados.has(usuario.id);
              const yaRegistrado = seleccionadosIniciales.has(usuario.id);
              const iniciales = usuario.nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
              const clases = clasesRestantesPaquete[usuario.id] || 0;
              const gratis = entradasGratisRestantes[usuario.id] || 0;
              const esProfesor = usuario.tipo_usuario?.trim() === "Profesor";
              const cantidadProfesor = Math.max(1, Number(cantidadesProfesor[usuario.id]) || 1);

              return (
                <div
                  key={usuario.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => alternarSeleccion(usuario.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      alternarSeleccion(usuario.id);
                    }
                  }}
                  className={`group relative min-h-[172px] rounded-[1.5rem] p-4 text-left transition-all border shadow-sm outline-none overflow-hidden ${
                    seleccionado
                      ? "bg-green-50/90 border-green-400 ring-4 ring-green-100 shadow-lg -translate-y-0.5"
                      : "bg-white/80 border-white hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-xl opacity-80"></div>
                  {seleccionado && <CheckCircle2 className="absolute right-3 top-3 text-green-500 z-10" size={24} strokeWidth={2.5} />}

                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg mb-4 ${seleccionado ? "bg-green-500 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}>
                        {iniciales || "?"}
                      </div>
                      <p className="font-black text-gray-900 leading-tight line-clamp-2">{usuario.nombre}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{usuario.tipo_usuario || "Sin tipo"}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {yaRegistrado && <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-lg">Ya estaba</span>}
                      {clases > 0 && <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-lg">{clases} clases</span>}
                      {gratis > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-lg">{gratis} gratis</span>}
                    </div>

                    {esProfesor && seleccionado && (
                      <div className="mt-4 bg-white/90 border border-blue-100 rounded-2xl p-2 shadow-sm" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Niñas que entran</p>
                        <div className="grid grid-cols-[36px_1fr_36px] items-center gap-2">
                          <button
                            type="button"
                            onClick={() => ajustarCantidadProfesor(usuario.id, cantidadProfesor - 1)}
                            className="h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center outline-none disabled:opacity-40"
                            disabled={cantidadProfesor <= 1}
                            aria-label="Restar niña"
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={cantidadProfesor}
                            onChange={(e) => ajustarCantidadProfesor(usuario.id, Number(e.target.value))}
                            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 text-center text-gray-900 font-black outline-none focus:border-blue-300"
                            aria-label="Cantidad de niñas"
                          />
                          <button
                            type="button"
                            onClick={() => ajustarCantidadProfesor(usuario.id, cantidadProfesor + 1)}
                            className="h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center outline-none"
                            aria-label="Sumar niña"
                          >
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 font-bold mt-2">${(tarifaPorAtletaProfesor * cantidadProfesor).toLocaleString("es-CO")} por cobrar</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {usuariosFiltrados.length === 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center text-gray-400 font-bold">
              No hay perfiles con esa búsqueda.
            </div>
          )}
        </div>

        <div className="fixed left-0 right-0 bottom-0 z-[60] pointer-events-none">
          <div className="max-w-3xl mx-auto p-4">
            <button
              type="button"
              onClick={guardarAsistencias}
              disabled={!hayCambios || guardando || seleccionados.size === 0}
              className="pointer-events-auto w-full bg-gray-950 hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 md:py-5 rounded-[1.5rem] shadow-2xl transition-all text-base md:text-lg outline-none"
            >
              {guardando ? "Guardando asistencias..." : `Guardar Asistencias (${seleccionados.size} seleccionados)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
