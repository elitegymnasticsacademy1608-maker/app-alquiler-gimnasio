/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { AttendanceGridModal } from "./components/AttendanceGridModal";
import { AppHeader } from "./components/AppHeader";
import { HistorialPerfiles } from "./components/HistorialPerfiles";
import { InicioScreen } from "./components/InicioScreen";
import { LoginScreen } from "./components/LoginScreen";
import {
  IconoAlerta,
  IconoCheck,
  IconoChevronLeft,
  IconoChevronRight,
  IconoClose,
  IconoEdit,
  IconoSearch,
  IconoStar,
  IconoTrash,
  IconoWallet,
} from "./components/icons";

export default function Home() {
  type DialogoApp = {
    tipo: "info" | "error" | "confirm";
    titulo: string;
    mensaje: string;
    textoConfirmar?: string;
    textoCancelar?: string;
  };

  // --- CONTROL DE PANTALLAS ---
  const [pantalla, setPantalla] = useState('inicio'); 
  const [rolActivo, setRolActivo] = useState('asistente'); 
  const [vistaActiva, setVistaActiva] = useState('caja');
  const [dialogoApp, setDialogoApp] = useState<DialogoApp | null>(null);
  const resolverDialogoRef = useRef<((confirmado: boolean) => void) | null>(null);

  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState(false);
  const CLAVE_ADMIN = "elite2026";

  const getFechaLocal = (d: Date) => {
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  };
  const [fechaCaja, setFechaCaja] = useState(getFechaLocal(new Date()));

  const entrarComoAsistente = () => { 
    setRolActivo('asistente'); 
    setVistaActiva('caja'); 
    setPantalla('app'); 
    setFechaCaja(getFechaLocal(new Date())); // Forzar a HOY por seguridad
  };
  
  const iniciarSesionAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (clave === CLAVE_ADMIN) { 
      setRolActivo('admin'); 
      setVistaActiva('caja'); 
      setPantalla('app'); 
      setErrorLogin(false); 
      setClave(""); 
    } else { 
      setErrorLogin(true); 
    }
  };
  
  const cerrarSesion = () => { 
    setPantalla('inicio'); 
    setRolActivo('asistente'); 
    setFechaCaja(getFechaLocal(new Date())); // Resetear fecha al salir
  };

  // --- NAVEGACIÓN EN EL TIEMPO (SOLO ADMIN) ---
  const cambiarDia = (dias: number) => {
    if (rolActivo !== 'admin') return; // Candado adicional
    const [y, m, d] = fechaCaja.split('-');
    const date = new Date(Number(y), Number(m)-1, Number(d));
    date.setDate(date.getDate() + dias);
    setFechaCaja(getFechaLocal(date));
  };

  const formatearFechaConDia = (fechaStr: string) => {
    if (!fechaStr) return '';
    const d = new Date(fechaStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const abrirDialogo = (dialogo: DialogoApp) => {
    return new Promise<boolean>((resolve) => {
      resolverDialogoRef.current = resolve;
      setDialogoApp(dialogo);
    });
  };

  const mostrarMensaje = async (titulo: string, mensaje: string, tipo: "info" | "error" = "info") => {
    await abrirDialogo({ tipo, titulo, mensaje, textoConfirmar: "Aceptar" });
  };

  const pedirConfirmacion = (titulo: string, mensaje: string, textoConfirmar = "Confirmar") => {
    return abrirDialogo({ tipo: "confirm", titulo, mensaje, textoConfirmar, textoCancelar: "Cancelar" });
  };

  const cerrarDialogo = (confirmado: boolean) => {
    resolverDialogoRef.current?.(confirmado);
    resolverDialogoRef.current = null;
    setDialogoApp(null);
  };

  // --- ESTADOS GLOBALES ---
  const [listaEntrenamientos, setListaEntrenamientos] = useState<any[]>([]);
  const [usuariosDB, setUsuariosDB] = useState<any[]>([]);
  const [registrosGlobales, setRegistrosGlobales] = useState<any[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  
  // --- FINANZAS Y DEUDAS ---
  const [finanzas, setFinanzas] = useState({ mensual: 0, semanal: 0, deudaTotal: 0, anual: 0 });
  const [listaDeudoresAgrupados, setListaDeudoresAgrupados] = useState<any[]>([]);
  const [resumenClientes, setResumenClientes] = useState<any[]>([]);
  const [visitasPorUsuario, setVisitasPorUsuario] = useState<Record<string, number>>({});
  const [clasesRestantesPaquete, setClasesRestantesPaquete] = useState<Record<string, number>>({});
  const [entradasGratisRestantes, setEntradasGratisRestantes] = useState<Record<string, number>>({});
  const [alertasPaquetes, setAlertasPaquetes] = useState<any[]>([]);
  const [ultimoGanadorSorteo, setUltimoGanadorSorteo] = useState<any>(null);
  const [estadisticasDias, setEstadisticasDias] = useState<{dia: string, cantidad: number}>({dia: '-', cantidad: 0});
  
  const [verDetalleDeuda, setVerDetalleDeuda] = useState(false);
  const [verDetallePagos, setVerDetallePagos] = useState(false);
  const [mostrarAnual, setMostrarAnual] = useState(false);
  const [mostrarResumenSemanalCaja, setMostrarResumenSemanalCaja] = useState(false);
  const [topDeudores, setTopDeudores] = useState<any[]>([]);

  // --- ESTADOS DE MODALES ---
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Modal Inscripción / Edición
  const [mostrarModalInscripcion, setMostrarModalInscripcion] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<any>(null);
  const [nombreInsc, setNombreInsc] = useState("");
  const [telefonoInsc, setTelefonoInsc] = useState("");
  const [tipoInsc, setTipoInsc] = useState("Gimnasta");

  // Modal Abonos y Cobros Agrupados
  const [deudorSeleccionado, setDeudorSeleccionado] = useState<any>(null);
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [metodoPagoAbono, setMetodoPagoAbono] = useState("Efectivo");

  // Gestión desde Caja
  const [mostrarModalAccionCaja, setMostrarModalAccionCaja] = useState(false);
  const [accionCajaTipo, setAccionCajaTipo] = useState<'pago' | 'nota'>('pago');
  const [notaIngreso, setNotaIngreso] = useState("");
  const [entrenamientoACobrar, setEntrenamientoACobrar] = useState<any>(null);
  const [montoAbonoCaja, setMontoAbonoCaja] = useState<number | "">(""); 

  // Filtros
  const [filtroCaja, setFiltroCaja] = useState('pendientes');
  const [busquedaCaja, setBusquedaCaja] = useState("");
  const [busquedaDeuda, setBusquedaDeuda] = useState("");
  const [mesConsulta, setMesConsulta] = useState(new Date().getMonth());
  const [anioConsulta, setAnioConsulta] = useState(new Date().getFullYear());
  
  const mesesDelAno = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const tarifaPorAtletaProfesor = 10000; 
  const tarifaPaquete = 90000; 
  const entradasPorPaquete = 12;
  const metodoCompraPaquete = "Compra Paquete (12)";
  const metodoUsoPaquete = "Uso de Paquete";
  const metodoPremioSorteo = "Sorteo Semanal - Entrada Gratis";
  const metodoUsoSorteo = "Uso Entrada Gratis Sorteo";
  const nombreGimnasio = "Elite Gym Center";

  const calcularPaquetes = (registros: any[]) => {
    const paquetes: any[] = [];
    const registrosOrdenados = [...registros].sort((a, b) => {
      const fechaA = new Date(a.fecha_asistencia + "T00:00:00").getTime();
      const fechaB = new Date(b.fecha_asistencia + "T00:00:00").getTime();
      if (fechaA !== fechaB) return fechaA - fechaB;
      return String(a.id).localeCompare(String(b.id));
    });

    registrosOrdenados.forEach((registro) => {
      if (!registro.usuario_id) return;

      if (registro.metodo_pago === metodoCompraPaquete) {
        paquetes.push({
          id: registro.id,
          usuario_id: registro.usuario_id,
          cliente: registro.usuarios_externos?.nombre || "Desconocido",
          paquete: `Paquete de ${entradasPorPaquete} clases`,
          fecha_compra: registro.fecha_asistencia,
          entradas_totales: entradasPorPaquete,
          entradas_usadas: 0,
        });
        return;
      }

      if (registro.metodo_pago === metodoUsoPaquete) {
        const paqueteDisponible = paquetes.find((paquete) => paquete.usuario_id === registro.usuario_id && paquete.entradas_usadas < paquete.entradas_totales);
        if (paqueteDisponible) paqueteDisponible.entradas_usadas += 1;
      }
    });

    const clasesRestantesPorUsuario: Record<string, number> = {};
    paquetes.forEach((paquete) => {
      const restantes = paquete.entradas_totales - paquete.entradas_usadas;
      clasesRestantesPorUsuario[paquete.usuario_id] = (clasesRestantesPorUsuario[paquete.usuario_id] || 0) + restantes;
    });

    return { paquetes, clasesRestantesPorUsuario };
  };

  const calcularEntradasGratis = (registros: any[]) => {
    const entradasGratis: Record<string, number> = {};

    registros.forEach((registro) => {
      if (!registro.usuario_id) return;
      if (registro.metodo_pago === metodoPremioSorteo) entradasGratis[registro.usuario_id] = (entradasGratis[registro.usuario_id] || 0) + 1;
      if (registro.metodo_pago === metodoUsoSorteo) entradasGratis[registro.usuario_id] = (entradasGratis[registro.usuario_id] || 0) - 1;
    });

    Object.keys(entradasGratis).forEach((uid) => {
      if (entradasGratis[uid] < 0) entradasGratis[uid] = 0;
    });

    return entradasGratis;
  };

  const obtenerDeudaCliente = (usuarioId: string) => {
    const registros = registrosGlobales
      .filter((registro) => registro.usuario_id === usuarioId && registro.estado_pago === "Pendiente")
      .sort((a, b) => new Date(a.fecha_asistencia).getTime() - new Date(b.fecha_asistencia).getTime());
    const saldo = registros.reduce((sum, registro) => sum + Number(registro.monto_generado), 0);
    return { saldo, registros };
  };

  const limpiarTelefonoWhatsApp = (telefono?: string | null) => {
    const digitos = (telefono || "").replace(/\D/g, "");
    if (!digitos) return null;
    if (digitos.length === 10 && digitos.startsWith("3")) return `57${digitos}`;
    if (digitos.length === 12 && digitos.startsWith("57")) return digitos;
    if (digitos.length >= 8 && digitos.length <= 15) return digitos;
    return null;
  };

  const obtenerRangoSemana = (fechaStr: string) => {
    const fecha = new Date(fechaStr + "T00:00:00");
    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() - fecha.getDay());
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin, inicioStr: getFechaLocal(inicio), finStr: getFechaLocal(fin) };
  };

  const fechaEnRango = (fechaStr: string, inicio: Date, fin: Date) => {
    const fecha = new Date(fechaStr + "T00:00:00");
    return fecha >= inicio && fecha <= fin;
  };

  const formatearFechaRecordatorio = (fechaStr: string) => {
    if (!fechaStr) return "";
    const d = new Date(fechaStr + "T00:00:00");
    return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  };

  const generarMensajeWhatsApp = (usuario: any, tipo: "recordatorio" | "estado" | "rapido" | "sorteo" | "semana" = "estado") => {
    const deuda = obtenerDeudaCliente(usuario.id);
    const fechaActual = new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota", year: "numeric", month: "long", day: "numeric" });

    if (tipo === "sorteo") {
      return `Hola ${usuario.nombre}, te saluda ${nombreGimnasio}.\n\nGanaste el sorteo semanal: tienes 1 entrada gratis disponible.\n\nFecha de consulta: ${fechaActual}\n\nGracias por entrenar con nosotros.\n${nombreGimnasio}`;
    }

    if (deuda.saldo <= 0) {
      return `Hola ${usuario.nombre}, te saluda ${nombreGimnasio}.\n\nTe compartimos tu estado de cuenta actualizado.\n\nActualmente no registras saldo pendiente. Tu cuenta se encuentra al día.\n\nFecha de consulta: ${fechaActual}\n\nGracias por entrenar con nosotros.\n${nombreGimnasio}`;
    }

    if (tipo === "semana") {
      const { inicio, fin } = obtenerRangoSemana(fechaCaja);
      const pendientesSemana = deuda.registros.filter((registro: any) => fechaEnRango(registro.fecha_asistencia, inicio, fin));
      if (pendientesSemana.length > 0) {
        const totalSemana = pendientesSemana.reduce((sum: number, registro: any) => sum + Number(registro.monto_generado), 0);
        const detalleSemana = pendientesSemana
          .map((registro: any) => `- ${formatearFechaRecordatorio(registro.fecha_asistencia)}: $${Number(registro.monto_generado).toLocaleString("es-CO")}`)
          .join("\n");
        return `Hola ${usuario.nombre}, te saluda ${nombreGimnasio}.\n\nTe recordamos que esta semana asististe y quedó pendiente un saldo de $${totalSemana.toLocaleString("es-CO")}.\n\nDías pendientes:\n${detalleSemana}\n\nPor favor, realiza el pago pendiente.\n\nFecha de consulta: ${fechaActual}\n\nGracias por entrenar con nosotros.\n${nombreGimnasio}`;
      }
    }

    const detalle = deuda.registros
      .map((registro: any) => `- ${formatearFechaConDia(registro.fecha_asistencia)}: $${Number(registro.monto_generado).toLocaleString("es-CO")}`)
      .join("\n");
    const textoDetalle = deuda.registros.length === 1
      ? "Este valor corresponde al siguiente pendiente:"
      : "Este valor corresponde a los siguientes pendientes:";

    return `Hola ${usuario.nombre}, te saluda ${nombreGimnasio}.\n\nTe compartimos tu estado de cuenta actualizado.\n\nActualmente registras un saldo pendiente de $${deuda.saldo.toLocaleString("es-CO")}.\n\n${textoDetalle}\n${detalle}\n\nPor favor, realiza el pago pendiente para mantener tu acceso activo.\n\nFecha de consulta: ${fechaActual}\n\nGracias por entrenar con nosotros.\n${nombreGimnasio}`;
  };

  const abrirWhatsAppCliente = (usuario: any, tipo: "recordatorio" | "estado" | "rapido" | "sorteo" | "semana" = "estado") => {
    const telefonoLimpio = limpiarTelefonoWhatsApp(usuario.telefono);
    if (!usuario.telefono) {
      mostrarMensaje("Teléfono no disponible", `No hay teléfono guardado para ${usuario.nombre}.`, "error");
      return;
    }
    if (!telefonoLimpio) {
      mostrarMensaje("Teléfono inválido", `El teléfono de ${usuario.nombre} no tiene un formato válido para WhatsApp.`, "error");
      return;
    }

    const mensaje = generarMensajeWhatsApp(usuario, tipo);
    const etiqueta = tipo === "sorteo" ? "aviso del sorteo" : tipo === "semana" ? "recordatorio semanal" : tipo === "recordatorio" ? "recordatorio de pago" : "estado de cuenta";
    pedirConfirmacion("Abrir WhatsApp", `¿Deseas abrir WhatsApp para enviar ${etiqueta} a ${usuario.nombre}?`, "Abrir WhatsApp").then((confirmado) => {
      if (!confirmado) return;
      window.open(`https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
    });
  };

  const obtenerInicioSemana = (fecha: Date) => {
    const inicio = new Date(fecha);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return getFechaLocal(inicio);
  };

  const sincronizarAlertasPaquetes = async (paquetes: any[]) => {
    const paquetesPorVencer = paquetes
      .map((paquete) => ({
        ...paquete,
        entradas_restantes: paquete.entradas_totales - paquete.entradas_usadas,
      }))
      .filter((paquete) => paquete.entradas_restantes === 2);

    if (paquetesPorVencer.length === 0) {
      setAlertasPaquetes([]);
      return;
    }

    const idsPaquetes = paquetesPorVencer.map((paquete) => paquete.id);
    const { data: alertasExistentes, error: errorAlertas } = await supabase
      .from("alertas_paquetes")
      .select("*")
      .in("registro_paquete_id", idsPaquetes)
      .order("created_at", { ascending: false });

    if (errorAlertas) {
      console.warn("Alertas de paquetes no disponibles:", errorAlertas.message);
      setAlertasPaquetes(paquetesPorVencer);
      return;
    }

    const idsAlertados = new Set((alertasExistentes || []).map((alerta) => alerta.registro_paquete_id));
    const nuevasAlertas = paquetesPorVencer
      .filter((paquete) => !idsAlertados.has(paquete.id))
      .map((paquete) => ({
        registro_paquete_id: paquete.id,
        usuario_id: paquete.usuario_id,
        paquete_nombre: paquete.paquete,
        entradas_restantes: paquete.entradas_restantes,
        fecha_compra: paquete.fecha_compra,
      }));

    if (nuevasAlertas.length > 0) {
      const { error: errorInsert } = await supabase.from("alertas_paquetes").insert(nuevasAlertas);
      if (errorInsert) console.warn("No se pudieron guardar alertas de paquetes:", errorInsert.message);
    }

    setAlertasPaquetes(paquetesPorVencer);
  };

  const procesarFinanzas = (registros: any[], mes: number, anio: number) => {
    let ingMes = 0; let ingSemana = 0; let deuda = 0; let ingAnual = 0;
    const clientesAgrupados: Record<string, any> = {};
    const conteoVisitasFidelidad: Record<string, number> = {};
    const deudoresAgrupados: Record<string, any> = {};
    const conteoDias: Record<number, number> = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
    const { paquetes, clasesRestantesPorUsuario } = calcularPaquetes(registros);
    const entradasGratis = calcularEntradasGratis(registros);

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0,0,0,0);

    registros.forEach((ent: any) => {
      const fechaEnt = new Date(ent.fecha_asistencia + 'T00:00:00');
      const monto = Number(ent.monto_generado);
      const uid = ent.usuario_id;
      const tipoUsuarioBD = ent.usuarios_externos?.tipo_usuario?.trim() || 'Gimnasta';
      const esProfesor = tipoUsuarioBD === 'Profesor';

      if (ent.cantidad_atletas > 0) conteoDias[fechaEnt.getDay()] += Number(ent.cantidad_atletas);

      if (uid) {
        if (!clientesAgrupados[uid]) {
          clientesAgrupados[uid] = { nombre: ent.usuarios_externos?.nombre || 'Desconocido', telefono: ent.usuarios_externos?.telefono || '-', tipo: tipoUsuarioBD, totalPagado: 0, visitasTotales: 0 };
        }
        if (ent.cantidad_atletas > 0) clientesAgrupados[uid].visitasTotales += 1;
        if (!esProfesor && ent.cantidad_atletas > 0) conteoVisitasFidelidad[uid] = (conteoVisitasFidelidad[uid] || 0) + 1;
      }

      if (ent.estado_pago === 'Pendiente') {
        deuda += monto;
        if (uid) {
          if (!deudoresAgrupados[uid]) {
            deudoresAgrupados[uid] = { usuario_id: uid, nombre: ent.usuarios_externos?.nombre || 'Desconocido', montoTotal: 0, registros: [] };
          }
          deudoresAgrupados[uid].montoTotal += monto;
          deudoresAgrupados[uid].registros.push(ent);
        }
      } else if (ent.estado_pago === 'Pagado') {
        if (fechaEnt.getFullYear() === anio) ingAnual += monto;
        if (fechaEnt.getMonth() === mes && fechaEnt.getFullYear() === anio) ingMes += monto;
        if (fechaEnt >= inicioSemana) ingSemana += monto;
        if (uid) clientesAgrupados[uid].totalPagado += monto;
      }
    });

    setClasesRestantesPaquete(clasesRestantesPorUsuario);
    setEntradasGratisRestantes(entradasGratis);
    if (rolActivo === "admin") sincronizarAlertasPaquetes(paquetes);

    const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    let mejorDiaIndex = 0; let maxAtletas = 0;
    Object.entries(conteoDias).forEach(([diaIdx, cant]) => {
      if (cant > maxAtletas) { maxAtletas = cant; mejorDiaIndex = Number(diaIdx); }
    });
    setEstadisticasDias({ dia: nombresDias[mejorDiaIndex], cantidad: maxAtletas });

    setFinanzas({ mensual: ingMes, semanal: ingSemana, deudaTotal: deuda, anual: ingAnual });
    setVisitasPorUsuario(conteoVisitasFidelidad);
    setResumenClientes(Object.values(clientesAgrupados).sort((a, b) => b.totalPagado - a.totalPagado));
    
    Object.values(deudoresAgrupados).forEach(d => d.registros.sort((a: any, b: any) => new Date(a.fecha_asistencia).getTime() - new Date(b.fecha_asistencia).getTime()));
    const arrDeudores = Object.values(deudoresAgrupados).sort((a, b) => b.montoTotal - a.montoTotal);
    setListaDeudoresAgrupados(arrDeudores);
    setTopDeudores(arrDeudores);
  };

  const cargarDatos = async () => {
    setCargandoLista(true);
    try {
      const { data: hoyData } = await supabase.from('registro_entrenamientos').select(`id, monto_generado, estado_pago, metodo_pago, cantidad_atletas, fecha_asistencia, usuario_id, usuarios_externos (nombre, telefono, tipo_usuario)`).eq('fecha_asistencia', fechaCaja).order('id', { ascending: false });
      setListaEntrenamientos(hoyData || []);

      const { data: clientes } = await supabase.from('usuarios_externos').select('*').order('nombre', { ascending: true });
      setUsuariosDB(clientes || []);

      const { data: todosLosRegistros } = await supabase.from('registro_entrenamientos').select(`id, monto_generado, estado_pago, fecha_asistencia, usuario_id, cantidad_atletas, metodo_pago, usuarios_externos (nombre, telefono, tipo_usuario)`);
      if (todosLosRegistros) {
        setRegistrosGlobales(todosLosRegistros);
        procesarFinanzas(todosLosRegistros, mesConsulta, anioConsulta);
      }
    } catch (error) { console.error("Error al cargar:", (error as Error).message); } 
    finally { setCargandoLista(false); }
  };

  useEffect(() => { if (pantalla === 'app') cargarDatos(); }, [pantalla, mesConsulta, anioConsulta, fechaCaja]);

  const confirmarAccionCaja = async () => {
    if (!entrenamientoACobrar) return;
    setCargando(true);
    try {
      if (accionCajaTipo === 'nota') {
         const { error } = await supabase.from('registro_entrenamientos').update({ metodo_pago: `Nota: ${notaIngreso}` }).eq('id', entrenamientoACobrar.id);
         if (error) throw error;
      } else {
         const deudorCaja = listaDeudoresAgrupados.find(d => d.usuario_id === entrenamientoACobrar.usuario_id);
         const registrosOrdenados = deudorCaja ? [...deudorCaja.registros].sort((a: any, b: any) => new Date(a.fecha_asistencia).getTime() - new Date(b.fecha_asistencia).getTime()) : [entrenamientoACobrar];
         
         let abono = Number(montoAbonoCaja);
         
         if (abono === entrenamientoACobrar.monto_generado) {
             await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pagado', metodo_pago: metodoPagoAbono }).eq('id', entrenamientoACobrar.id);
         } else {
             for (const deuda of registrosOrdenados) {
                if (abono <= 0) break;
                if (abono >= deuda.monto_generado) {
                  await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pagado', metodo_pago: metodoPagoAbono }).eq('id', deuda.id);
                  abono -= deuda.monto_generado;
                } else {
                  const restante = deuda.monto_generado - abono;
                  await supabase.from('registro_entrenamientos').update({ monto_generado: restante }).eq('id', deuda.id);
                  await supabase.from('registro_entrenamientos').insert([{
                    usuario_id: deuda.usuario_id, cantidad_atletas: 0, 
                    monto_generado: abono, estado_pago: 'Pagado', metodo_pago: `Abono Parcial (${metodoPagoAbono})`, fecha_asistencia: getFechaLocal(new Date())
                  }]);
                  abono = 0;
                }
             }
         }
      }
      
      setMostrarModalAccionCaja(false);
      setNotaIngreso("");
      setEntrenamientoACobrar(null);
      setMontoAbonoCaja("");
      cargarDatos();
    } catch (error) { mostrarMensaje("No se pudo actualizar", (error as Error).message, "error"); }
    finally { setCargando(false); }
  };

  const venderPaquete = async (uid: string) => {
    if (!await pedirConfirmacion("Vender paquete", "¿Confirmas la venta de un paquete de 12 clases por $90.000? Se registrará como pagado hoy.", "Confirmar venta")) return;
    try {
      const { error } = await supabase.from("registro_entrenamientos").insert([{ 
        usuario_id: uid, cantidad_atletas: 0, monto_generado: tarifaPaquete, estado_pago: 'Pagado', metodo_pago: 'Compra Paquete (12)', fecha_asistencia: getFechaLocal(new Date()) 
      }]);
      if (error) throw error;
      cargarDatos();
    } catch { mostrarMensaje("No se pudo activar el paquete", "Revisa la conexión o permisos de Supabase e inténtalo nuevamente.", "error"); }
  };

  const realizarSorteoSemanal = async () => {
    if (rolActivo !== "admin") return;
    const participantes = usuariosDB.filter((usuario) => (usuario.tipo_usuario || "").trim() !== "Profesor");
    if (participantes.length === 0) {
      mostrarMensaje("Sorteo no disponible", "No hay clientes inscritos para realizar el sorteo.", "info");
      return;
    }

    const hoy = new Date();
    const fechaSorteo = getFechaLocal(hoy);
    const semanaInicio = obtenerInicioSemana(hoy);

    setCargando(true);
    try {
      const { data: sorteosSemana, error: errorConsulta } = await supabase
        .from("sorteos_semanales")
        .select("id, ganador_id, fecha_sorteo")
        .eq("semana_inicio", semanaInicio);

      if (errorConsulta) throw errorConsulta;
      if ((sorteosSemana || []).length > 0 && !await pedirConfirmacion("Sorteo ya registrado", "Ya existe un sorteo registrado esta semana. ¿Deseas realizar otro sorteo de todos modos?", "Realizar otro")) return;

      const ganador = participantes[Math.floor(Math.random() * participantes.length)];
      const { data: sorteoCreado, error: errorSorteo } = await supabase
        .from("sorteos_semanales")
        .insert([{
          ganador_id: ganador.id,
          fecha_sorteo: fechaSorteo,
          semana_inicio: semanaInicio,
          premio: "1 entrada gratis",
          admin_ejecutor: rolActivo,
        }])
        .select()
        .single();

      if (errorSorteo) throw errorSorteo;

      const { error: errorEntrada } = await supabase.from("registro_entrenamientos").insert([{
        usuario_id: ganador.id,
        cantidad_atletas: 0,
        monto_generado: 0,
        estado_pago: "Pagado",
        metodo_pago: metodoPremioSorteo,
        fecha_asistencia: fechaSorteo,
      }]);

      if (errorEntrada) throw errorEntrada;

      setUltimoGanadorSorteo({ ...ganador, sorteo: sorteoCreado });
      await cargarDatos();
    } catch (error) {
      mostrarMensaje("No se pudo realizar el sorteo", (error as Error).message, "error");
    } finally {
      setCargando(false);
    }
  };

  const procesarAbonoTotal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      let abono = Number(montoAbono);
      if (abono <= 0 || abono > deudorSeleccionado.montoTotal) throw new Error("El monto no es válido.");

      for (const deuda of deudorSeleccionado.registros) {
        if (abono <= 0) break;
        if (abono >= deuda.monto_generado) {
          await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pagado', metodo_pago: metodoPagoAbono }).eq('id', deuda.id);
          abono -= deuda.monto_generado;
        } else {
          const restante = deuda.monto_generado - abono;
          await supabase.from('registro_entrenamientos').update({ monto_generado: restante }).eq('id', deuda.id);
          await supabase.from('registro_entrenamientos').insert([{
            usuario_id: deuda.usuario_id, cantidad_atletas: 0, monto_generado: abono, estado_pago: 'Pagado', metodo_pago: `Abono Parcial (${metodoPagoAbono})`, fecha_asistencia: getFechaLocal(new Date())
          }]);
          abono = 0;
        }
      }
      setDeudorSeleccionado(null); setMontoAbono("");
      cargarDatos();
    } catch (error) { mostrarMensaje("No se pudo registrar el abono", (error as Error).message, "error"); }
    finally { setCargando(false); }
  };

  const inscribirUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { error } = await supabase.from("usuarios_externos").insert([{ nombre: nombreInsc, telefono: telefonoInsc, tipo_usuario: tipoInsc }]);
      if (error) throw error;
      setNombreInsc(""); setTelefonoInsc(""); setMostrarModalInscripcion(false);
      cargarDatos();
    } catch (error) { mostrarMensaje("No se pudo guardar la ficha", (error as Error).message, "error"); }
    finally { setCargando(false); }
  };

  const abrirModalInscripcion = () => {
    setUsuarioAEditar(null);
    setNombreInsc("");
    setTelefonoInsc("");
    setTipoInsc("Gimnasta");
    setMostrarModalInscripcion(true);
  };

  const editarUsuarioInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioAEditar) return;
    setCargando(true);
    try {
      const { error } = await supabase.from("usuarios_externos").update({ nombre: nombreInsc, telefono: telefonoInsc, tipo_usuario: tipoInsc }).eq('id', usuarioAEditar.id);
      if (error) throw error;
      setNombreInsc(""); setTelefonoInsc(""); setMostrarModalEdicion(false); setUsuarioAEditar(null);
      cargarDatos();
    } catch (error) { mostrarMensaje("No se pudo editar la ficha", (error as Error).message, "error"); }
    finally { setCargando(false); }
  };

  const abrirModalEditar = (u: any) => {
    setUsuarioAEditar(u);
    setNombreInsc(u.nombre);
    setTelefonoInsc(u.telefono || "");
    setTipoInsc(u.tipo_usuario);
    setMostrarModalEdicion(true);
  };

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (!await pedirConfirmacion("Eliminar cliente", `¿Estás seguro de eliminar a ${nombre}? Esta acción puede afectar su historial.`, "Eliminar")) return;
    try {
      const { error } = await supabase.from('usuarios_externos').delete().eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch { mostrarMensaje("No se pudo eliminar", "No se puede eliminar este cliente. Probablemente tiene registros en el historial.", "error"); }
  };

  const eliminarIngreso = async (id: string) => {
    if (!await pedirConfirmacion("Eliminar registro", "¿Seguro que deseas eliminar por completo este registro?", "Eliminar")) return;
    try {
      const { error } = await supabase.from('registro_entrenamientos').delete().eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch { mostrarMensaje("No se pudo eliminar", "El registro no pudo eliminarse.", "error"); }
  };

  const reversarPago = async (id: string) => {
    if (!await pedirConfirmacion("Anular pago", "¿Estás seguro de anular este pago? Volverá a aparecer como deuda.", "Anular pago")) return;
    try {
      const { error } = await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pendiente', metodo_pago: null }).eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch (error) { mostrarMensaje("No se pudo anular el pago", (error as Error).message, "error"); }
  };

  const totalPersonasHoy = listaEntrenamientos.reduce((suma, item) => suma + Number(item.cantidad_atletas), 0);
  const totalEsperadoHoy = listaEntrenamientos.reduce((suma, item) => suma + Number(item.monto_generado), 0);
  const totalRecaudadoHoy = listaEntrenamientos.filter(i => i.estado_pago === 'Pagado').reduce((suma, item) => suma + Number(item.monto_generado), 0);
  const totalFaltanteHoy = totalEsperadoHoy - totalRecaudadoHoy;

  const entrenamientosFiltrados = listaEntrenamientos.filter(item => {
    const cumpleEstado = filtroCaja === 'pendientes' ? item.estado_pago === 'Pendiente' : item.estado_pago === 'Pagado';
    const cumpleBusqueda = (item.usuarios_externos?.nombre || "").toLowerCase().includes(busquedaCaja.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  const deudoresFiltrados = listaDeudoresAgrupados.filter(deuda => deuda.nombre.toLowerCase().includes(busquedaDeuda.toLowerCase()));
  const semanaCaja = obtenerRangoSemana(fechaCaja);
  const registrosSemanaCaja = registrosGlobales.filter((registro) => fechaEnRango(registro.fecha_asistencia, semanaCaja.inicio, semanaCaja.fin) && Number(registro.cantidad_atletas) > 0);
  const totalEntradasSemanaCaja = registrosSemanaCaja.reduce((sum, registro) => sum + Number(registro.cantidad_atletas), 0);
  const asistentesSemanaCaja = Object.values(registrosSemanaCaja.reduce((acc: Record<string, any>, registro) => {
    const uid = registro.usuario_id || registro.id;
    if (!acc[uid]) {
      acc[uid] = {
        usuario_id: registro.usuario_id,
        nombre: registro.usuarios_externos?.nombre || "Desconocido",
        telefono: registro.usuarios_externos?.telefono,
        tipo_usuario: registro.usuarios_externos?.tipo_usuario,
        entradas: 0,
        dias: [],
      };
    }
    acc[uid].entradas += Number(registro.cantidad_atletas);
    acc[uid].dias.push(registro.fecha_asistencia);
    return acc;
  }, {})).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, "es"));
  const deudoresSemanaCaja = Object.values(registrosSemanaCaja
    .filter((registro) => registro.estado_pago === "Pendiente")
    .reduce((acc: Record<string, any>, registro) => {
      const uid = registro.usuario_id || registro.id;
      if (!acc[uid]) {
        acc[uid] = {
          usuario_id: registro.usuario_id,
          nombre: registro.usuarios_externos?.nombre || "Desconocido",
          telefono: registro.usuarios_externos?.telefono,
          tipo_usuario: registro.usuarios_externos?.tipo_usuario,
          montoTotal: 0,
          registros: [],
        };
      }
      acc[uid].montoTotal += Number(registro.monto_generado);
      acc[uid].registros.push(registro);
      return acc;
    }, {})).sort((a: any, b: any) => b.montoTotal - a.montoTotal);

  // --- RENDERING PRINCIPAL ---
  if (pantalla === 'inicio') {
    return <InicioScreen onEntrarAsistente={entrarComoAsistente} onEntrarAdmin={() => setPantalla('login')} />;
  }

  if (pantalla === 'login') {
    return <LoginScreen clave={clave} errorLogin={errorLogin} onClaveChange={setClave} onSubmit={iniciarSesionAdmin} onBack={() => setPantalla('inicio')} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-10">
      <AppHeader rolActivo={rolActivo} vistaActiva={vistaActiva} onVistaChange={setVistaActiva} onCerrarSesion={cerrarSesion} />

      {vistaActiva === 'caja' && (
        <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
          
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-50 pb-6">
               <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  {rolActivo === 'admin' && (
                    <button onClick={() => cambiarDia(-1)} className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-blue-600 transition-colors"><IconoChevronLeft /></button>
                  )}
                  <div className="text-center px-4 min-w-[160px]">
                    <h2 className="text-xl font-black text-gray-800 tracking-tight capitalize">
                      {fechaCaja === getFechaLocal(new Date()) ? "Caja de Hoy" : new Date(fechaCaja + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </h2>
                  </div>
                  {rolActivo === 'admin' && (
                    <button onClick={() => cambiarDia(1)} disabled={fechaCaja === getFechaLocal(new Date())} className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:hover:text-gray-500"><IconoChevronRight /></button>
                  )}
               </div>
               
               <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                 <button onClick={abrirModalInscripcion} className="bg-white hover:bg-gray-50 text-blue-700 border border-blue-100 px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all outline-none w-full sm:w-auto">
                   + Nueva persona
                 </button>
                 <button onClick={() => setMostrarModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-md transition-all outline-none w-full sm:w-auto">
                   Tomar Asistencia
                 </button>
               </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Entradas Registradas</p>
                  <p className="text-3xl font-black text-blue-950">{totalPersonasHoy}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Caja Esperada</p>
                  <p className="text-3xl font-black text-gray-800">${totalEsperadoHoy.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                  <p className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Ya Recaudado</p>
                  <p className="text-3xl font-black text-green-600">${totalRecaudadoHoy.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1">Faltan por Pagar</p>
                  <p className="text-3xl font-black text-red-500">${totalFaltanteHoy.toLocaleString('es-CO')}</p>
                </div>
             </div>
          </div>

          <div className="fixed right-4 bottom-4 z-40 w-[calc(100vw-2rem)] max-w-md md:right-6 md:bottom-6">
            {mostrarResumenSemanalCaja ? (
              <div className="bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in">
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/70">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Semana en Caja</p>
                    <h3 className="text-lg font-black text-gray-900">Entradas y pendientes</h3>
                    <p className="text-xs font-bold text-gray-400 capitalize">{formatearFechaConDia(semanaCaja.inicioStr)} - {formatearFechaConDia(semanaCaja.finStr)}</p>
                  </div>
                  <button type="button" onClick={() => setMostrarResumenSemanalCaja(false)} className="text-gray-400 hover:text-gray-800 bg-white p-2 rounded-xl outline-none">
                    <IconoClose />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Entradas</p>
                    <p className="text-2xl font-black text-blue-900">{totalEntradasSemanaCaja}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Personas</p>
                    <p className="text-2xl font-black text-gray-800">{asistentesSemanaCaja.length}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Deben</p>
                    <p className="text-2xl font-black text-red-500">{deudoresSemanaCaja.length}</p>
                  </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-4">
                  {deudoresSemanaCaja.length > 0 ? (
                    <div className="space-y-3">
                      {deudoresSemanaCaja.map((deudor: any) => {
                        const usuario = usuariosDB.find((u) => u.id === deudor.usuario_id);
                        return (
                          <div key={deudor.usuario_id || deudor.nombre} className="border border-red-100 bg-red-50/60 rounded-2xl p-4">
                            <div className="flex justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-black text-gray-900 truncate">{deudor.nombre}</p>
                                <p className="text-xs font-bold text-red-500">${deudor.montoTotal.toLocaleString("es-CO")} pendiente</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => usuario && abrirWhatsAppCliente(usuario, "semana")}
                                disabled={!usuario}
                                className="shrink-0 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-3 py-2 rounded-xl text-xs outline-none"
                              >
                                WhatsApp
                              </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {deudor.registros.map((registro: any) => (
                                <span key={registro.id} className="bg-white border border-red-100 text-red-600 text-[11px] font-black px-2 py-1 rounded-lg capitalize">
                                  {formatearFechaRecordatorio(registro.fecha_asistencia)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm font-bold text-gray-400">Esta semana no hay asistentes con pagos pendientes.</p>
                    </div>
                  )}

                  {asistentesSemanaCaja.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">También entraron esta semana</p>
                      <div className="flex flex-wrap gap-2">
                        {asistentesSemanaCaja.slice(0, 12).map((asistente: any) => (
                          <span key={asistente.usuario_id || asistente.nombre} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl">
                            {asistente.nombre} ({asistente.entradas})
                          </span>
                        ))}
                        {asistentesSemanaCaja.length > 12 && <span className="bg-gray-100 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-xl">+{asistentesSemanaCaja.length - 12}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarResumenSemanalCaja(true)}
                className="ml-auto flex items-center gap-3 bg-gray-950 hover:bg-black text-white shadow-2xl rounded-2xl px-5 py-4 outline-none"
              >
                <span className="bg-white/10 text-red-200 p-2 rounded-xl"><IconoAlerta /></span>
                <span className="text-left">
                  <span className="block text-xs font-black uppercase tracking-widest text-white/60">Semana</span>
                  <span className="block font-black">{deudoresSemanaCaja.length} pendientes</span>
                </span>
              </button>
            )}
          </div>

          {rolActivo === 'admin' && alertasPaquetes.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-amber-600"><IconoAlerta /></span>
                <h3 className="text-lg font-black text-amber-900">Paquetes por finalizar</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 {alertasPaquetes.map((alerta) => (
                  <div key={alerta.id} className="bg-white border border-amber-100 rounded-2xl p-4">
                    <p className="font-black text-gray-800 truncate">{alerta.cliente}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{alerta.paquete}</p>
                    <div className="flex justify-between items-end mt-4 gap-3">
                      <span className="bg-amber-100 text-amber-700 font-black px-3 py-1.5 rounded-xl text-sm">{alerta.entradas_restantes} entradas</span>
                      <span className="text-[11px] font-bold text-gray-400 text-right">Compra: {formatearFechaConDia(alerta.fecha_compra)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const usuario = usuariosDB.find((u) => u.id === alerta.usuario_id);
                        if (usuario) abrirWhatsAppCliente(usuario, "estado");
                      }}
                      className="mt-3 w-full bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2 rounded-xl text-xs transition-colors outline-none"
                    >
                      WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex bg-gray-200/50 p-1.5 rounded-2xl w-full md:w-auto">
               <button onClick={() => setFiltroCaja('pendientes')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold text-sm transition-all outline-none ${filtroCaja === 'pendientes' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Falta cobrar</button>
               <button onClick={() => setFiltroCaja('pagados')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold text-sm transition-all outline-none ${filtroCaja === 'pagados' ? 'bg-white text-green-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Ya pagaron</button>
            </div>
            <div className="relative w-full md:w-80">
               <span className="absolute left-4 top-3.5 text-gray-400"><IconoSearch /></span>
               <input type="text" placeholder="Buscar entrada..." value={busquedaCaja} onChange={(e) => setBusquedaCaja(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:outline-none text-gray-800 bg-white" />
            </div>
          </div>

          {cargandoLista ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {entrenamientosFiltrados.map((item, i) => (
                <div key={i} onClick={() => { 
                    if(item.estado_pago === 'Pendiente') { 
                        setEntrenamientoACobrar(item); 
                        setAccionCajaTipo('pago'); 
                        setMontoAbonoCaja(item.monto_generado); 
                        setMostrarModalAccionCaja(true); 
                    } 
                }} className={`bg-white rounded-[24px] shadow-sm border overflow-hidden flex flex-col relative transition-all ${item.estado_pago === 'Pendiente' ? 'border-gray-200 hover:border-blue-300 cursor-pointer hover:shadow-md' : 'border-gray-100'}`}>
                  <div className={`px-5 py-4 font-bold flex justify-between items-center border-b border-gray-50 ${item.estado_pago === 'Pendiente' ? 'bg-red-50/50' : 'bg-green-50/50'}`}>
                    <span className="truncate text-gray-800 text-lg pr-2">{item.usuarios_externos?.nombre || 'Desconocido'}</span>
                    <div className="flex gap-1">
                      {item.estado_pago === 'Pagado' && <button onClick={(e) => { e.stopPropagation(); reversarPago(item.id); }} className="text-gray-300 hover:text-yellow-600 outline-none" title="Anular Pago"><IconoClose /></button>}
                      <button onClick={(e) => { e.stopPropagation(); eliminarIngreso(item.id); }} className="text-gray-300 hover:text-red-500 outline-none" title="Eliminar Entrada"><IconoTrash /></button>
                    </div>
                  </div>
                  <div className="p-5 flex-grow text-gray-600">
                    <p className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-lg inline-block text-gray-500 mb-2 uppercase tracking-widest">{item.usuarios_externos?.tipo_usuario}</p>
                    {item.usuarios_externos?.tipo_usuario === 'Profesor' && Number(item.cantidad_atletas) > 0 && (
                      <p className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg inline-block ml-2">
                        {Number(item.cantidad_atletas)} niñas
                      </p>
                    )}
                    <p className="text-3xl font-black text-gray-800 mt-2">${item.monto_generado.toLocaleString('es-CO')}</p>
                    {item.estado_pago === 'Pagado' && item.monto_generado > 0 && <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1"><IconoCheck className="w-3 h-3"/> {item.metodo_pago}</p>}
                    {item.estado_pago === 'Pagado' && item.monto_generado === 0 && <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1"><IconoStar /> {item.metodo_pago}</p>}
                    {item.estado_pago === 'Pendiente' && item.metodo_pago && item.metodo_pago.startsWith('Nota:') && (
                       <p className="text-xs text-red-500 font-bold mt-3 bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-center gap-2">
                          <IconoAlerta /> {item.metodo_pago.substring(6)}
                       </p>
                    )}
                  </div>
                </div>
              ))}
              {entrenamientosFiltrados.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-16 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                  <p className="text-lg font-medium">{busquedaCaja ? "Sin resultados" : (filtroCaja === 'pendientes' ? "Todos han pagado (o no hay deudores)." : "Aún no hay cobros registrados.")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {vistaActiva === 'finanzas' && rolActivo === 'admin' && (
        <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div><h2 className="text-3xl font-black text-gray-800 tracking-tight">Análisis Financiero</h2></div>
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200">
              <select value={mesConsulta} onChange={e => setMesConsulta(Number(e.target.value))} className="bg-transparent border-none text-blue-600 font-bold outline-none cursor-pointer pr-2 pl-3 py-1">
                {mesesDelAno.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={anioConsulta} onChange={e => setAnioConsulta(Number(e.target.value))} className="bg-transparent border-none text-gray-500 font-bold outline-none cursor-pointer pr-3 py-1 bg-gray-50 rounded-xl">
                {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative">
            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg col-span-2 md:col-span-1 flex flex-col justify-center">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Semana Actual</p>
              <p className="text-3xl font-black">${finanzas.semanal.toLocaleString('es-CO')}</p>
            </div>
            
            <div onClick={() => { setVerDetallePagos(true); setVerDetalleDeuda(false); }} className={`p-6 rounded-3xl border cursor-pointer flex flex-col justify-center col-span-2 md:col-span-2 ${verDetallePagos ? 'bg-white border-blue-500 shadow-md ring-4 ring-blue-50' : 'bg-white border-gray-100 hover:border-blue-300 shadow-sm'}`}>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total {mesesDelAno[mesConsulta]} {anioConsulta}</p>
              <p className="text-3xl font-black text-gray-800">${finanzas.mensual.toLocaleString('es-CO')}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center col-span-2 md:col-span-1 relative z-30">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Recaudo Anual</p>
              <div className="relative inline-block">
                <button onClick={() => setMostrarAnual(!mostrarAnual)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold py-2 px-4 rounded-xl transition-colors outline-none">
                  {mostrarAnual ? 'Ocultar Resumen' : 'Ver Resumen'}
                </button>

                {mostrarAnual && (
                  <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl z-50 min-w-[260px] animate-in fade-in zoom-in duration-300">
                    <button onClick={() => setMostrarAnual(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white outline-none"><IconoClose/></button>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 text-left">Total 2026</p>
                    <p className="text-4xl font-black text-blue-400 text-left">${finanzas.anual.toLocaleString('es-CO')}</p>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 mb-10">
             <div onClick={() => { setVerDetalleDeuda(true); setVerDetallePagos(false); }} className={`p-6 rounded-3xl border cursor-pointer flex items-center justify-between ${verDetalleDeuda ? 'bg-red-500 border-red-500 shadow-lg' : 'bg-white border-red-100 hover:border-red-300 shadow-sm'}`}>
                <div>
                   <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${verDetalleDeuda ? 'text-red-200' : 'text-red-400'}`}>Cartera Pendiente Total</p>
                   <p className={`text-4xl font-black ${verDetalleDeuda ? 'text-white' : 'text-red-500'}`}>${finanzas.deudaTotal.toLocaleString('es-CO')}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${verDetalleDeuda ? 'bg-white/20 text-white' : 'bg-red-50 text-red-500'}`}><IconoWallet /></div>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Mejor día operativo</p>
              <p className="text-xl font-black text-gray-800">{estadisticasDias.dia}</p>
            </div>
            <p className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl">{estadisticasDias.cantidad} atletas registrados</p>
          </div>

          {topDeudores.length > 0 && !verDetalleDeuda && !verDetallePagos && (
             <div className="mb-10 animate-fade-in">
               <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span className="bg-red-100 text-red-500 p-1.5 rounded-lg"><IconoAlerta /></span> Mayores Deudores (Toca para cobrar)
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 {topDeudores.slice(0, 4).map((d, i) => (
                   <div key={i} onClick={() => setDeudorSeleccionado(d)} className="bg-white p-5 rounded-3xl border border-red-100 shadow-sm cursor-pointer hover:shadow-md hover:border-red-300 transition-all">
                     <p className="font-bold text-gray-800 truncate">{d.nombre}</p>
                     <p className="text-2xl font-black text-red-500 mt-2">${d.montoTotal.toLocaleString('es-CO')}</p>
                     <div className="flex items-center justify-between gap-2 mt-3">
                       <p className="text-xs font-medium text-red-400 inline-block bg-red-50 px-2 py-1 rounded-md">{d.registros.length} entradas</p>
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           const usuario = usuariosDB.find((u) => u.id === d.usuario_id);
                           if (usuario) abrirWhatsAppCliente(usuario, "recordatorio");
                         }}
                         className="text-xs bg-green-50 text-green-700 hover:bg-green-100 font-bold px-3 py-1.5 rounded-lg outline-none"
                       >
                         WhatsApp
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {verDetalleDeuda && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 animate-fade-in mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-50 pb-4">
                 <h3 className="text-2xl font-bold text-gray-800">Directorio de Deudores</h3>
                 <div className="relative w-full md:w-72">
                   <span className="absolute left-4 top-3 text-gray-400"><IconoSearch /></span>
                   <input type="text" placeholder="Buscar por nombre..." value={busquedaDeuda} onChange={(e) => setBusquedaDeuda(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:border-red-200 focus:bg-white focus:outline-none text-gray-800 transition-all text-sm font-medium" />
                 </div>
              </div>

              {listaDeudoresAgrupados.length === 0 ? (
                 <div className="text-center py-10"><p className="text-gray-400 font-medium">Nadie debe dinero en este momento.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deudoresFiltrados.map((d, i) => (
                    <div key={i} onClick={() => setDeudorSeleccionado(d)} className="bg-white border border-gray-100 hover:border-red-200 shadow-sm hover:shadow-md transition-all rounded-3xl p-5 cursor-pointer flex flex-col justify-between">
                       <div>
                         <div className="flex justify-between items-start mb-4">
                           <h4 className="font-bold text-gray-800 leading-tight pr-2">{d.nombre}</h4>
                           <span className="bg-red-50 text-red-500 font-bold text-xs px-2 py-1 rounded-lg">{d.registros.length} clases</span>
                         </div>
                         <p className="text-3xl font-black text-red-500 mb-4">${d.montoTotal.toLocaleString('es-CO')}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         <button className="bg-red-50 text-red-600 font-bold py-2 rounded-xl text-sm transition-colors hover:bg-red-100 outline-none">Saldar Deuda</button>
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             const usuario = usuariosDB.find((u) => u.id === d.usuario_id);
                             if (usuario) abrirWhatsAppCliente(usuario, "recordatorio");
                           }}
                           className="bg-green-50 text-green-700 font-bold py-2 rounded-xl text-sm transition-colors hover:bg-green-100 outline-none"
                         >
                           WhatsApp
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {verDetallePagos && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 animate-fade-in mb-8">
              <div className="border-b border-gray-50 pb-4 mb-6"><h3 className="text-2xl font-bold text-gray-800">Ranking y Fidelidad</h3></div>
              {resumenClientes.length === 0 ? (
                 <div className="text-center py-10"><p className="text-gray-400 font-medium">Aún no hay pagos en este mes.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr><th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Cliente</th><th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-center">Visitas</th><th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Aportado</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {resumenClientes.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4"><p className="font-bold text-gray-800">{c.nombre}</p><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block">{c.tipo}</span></td>
                          <td className="p-4 text-center font-bold text-blue-600 text-lg">{c.visitasTotales}</td>
                          <td className="p-4 text-right text-green-600 font-black text-lg">${c.totalPagado.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {vistaActiva === 'historial' && rolActivo === 'admin' && (
        <HistorialPerfiles
          usuarios={usuariosDB}
          registros={registrosGlobales}
          clasesRestantesPaquete={clasesRestantesPaquete}
          formatearFechaConDia={formatearFechaConDia}
        />
      )}

      {/* --- AQUÍ ESTÁ EL BLOQUE RESTAURADO: DIRECTORIO DE ATLETAS --- */}
      {vistaActiva === 'basedatos' && rolActivo === 'admin' && (
        <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
            <div><h2 className="text-3xl font-black text-gray-800 tracking-tight">Directorio de Atletas</h2></div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button onClick={realizarSorteoSemanal} disabled={cargando} className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl font-bold shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center outline-none disabled:opacity-50">Realizar sorteo semanal</button>
              <button onClick={abrirModalInscripcion} className="bg-blue-950 hover:bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center outline-none">+ Inscribir Cliente</button>
            </div>
          </div>
          {ultimoGanadorSorteo && (
            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-5 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Ganador del sorteo semanal</p>
                <h3 className="text-xl font-black text-gray-800">{ultimoGanadorSorteo.nombre}</h3>
                <p className="text-sm font-bold text-amber-700 mt-1">Premio: 1 entrada gratis</p>
              </div>
              <button onClick={() => abrirWhatsAppCliente(ultimoGanadorSorteo, "sorteo")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-bold shadow-sm transition-colors outline-none">Enviar WhatsApp</button>
            </div>
          )}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</th><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Paquete</th><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usuariosDB.map((u, i) => {
                    const clasesLeft = clasesRestantesPaquete[u.id] || 0;
                    const gratisLeft = entradasGratisRestantes[u.id] || 0;
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-gray-800">{u.nombre}</p>
                          <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{u.telefono || 'Sin contacto'} • {u.tipo_usuario}</p>
                          {gratisLeft > 0 && <span className="mt-2 inline-block bg-amber-100 text-amber-700 font-black text-[10px] px-2 py-1 rounded-lg">{gratisLeft} gratis</span>}
                        </td>
                        <td className="p-5 text-center">
                          {u.tipo_usuario !== 'Profesor' ? (
                            clasesLeft > 0 ? <span className="bg-green-100 text-green-700 font-black px-3 py-1.5 rounded-xl">{clasesLeft} Clases</span> : <button onClick={() => venderPaquete(u.id)} className="bg-gray-100 hover:bg-green-50 text-gray-500 hover:text-green-600 font-bold px-4 py-2 rounded-xl text-xs transition-colors border border-gray-200 outline-none">Vender Paquete</button>
                          ) : <span className="text-gray-300 text-xs font-bold">No Aplica</span>}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2">
                             <button onClick={() => abrirWhatsAppCliente(u, "estado")} className="text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-xl transition-colors outline-none text-xs font-bold">WhatsApp</button>
                             <button onClick={() => abrirModalEditar(u)} className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-2 rounded-xl transition-colors outline-none"><IconoEdit /></button>
                             <button onClick={() => eliminarUsuario(u.id, u.nombre)} className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 rounded-xl transition-colors outline-none"><IconoTrash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AttendanceGridModal
        abierto={mostrarModal}
        usuarios={usuariosDB}
        registrosDelDia={listaEntrenamientos}
        fechaCaja={fechaCaja}
        clasesRestantesPaquete={clasesRestantesPaquete}
        entradasGratisRestantes={entradasGratisRestantes}
        visitasPorUsuario={visitasPorUsuario}
        tarifaPorAtletaProfesor={tarifaPorAtletaProfesor}
        onCrearUsuario={abrirModalInscripcion}
        onCerrar={() => setMostrarModal(false)}
        onGuardado={() => {
          setFiltroCaja("pendientes");
          cargarDatos();
        }}
      />

      {/* --- MODAL GESTIÓN DE COBRO PRO (CAJA DIARIA) RE-DISEÑADO --- */}
      {mostrarModalAccionCaja && entrenamientoACobrar && (() => {
         const deudorCaja = listaDeudoresAgrupados.find(d => d.usuario_id === entrenamientoACobrar.usuario_id);
         const registrosAnteriores = deudorCaja ? deudorCaja.registros.filter((r: any) => r.id !== entrenamientoACobrar.id) : [];
         const deudaAnterior = registrosAnteriores.reduce((sum: number, r: any) => sum + r.monto_generado, 0);
         const montoHoy = entrenamientoACobrar.monto_generado;
         const montoTotalPagar = montoHoy + deudaAnterior;

         return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                 <button onClick={() => {setMostrarModalAccionCaja(false); setNotaIngreso("");}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 outline-none"><IconoClose /></button>
                 
                 <div className="mb-4 pr-6">
                   <h3 className="text-2xl font-black text-gray-800 truncate">{entrenamientoACobrar.usuarios_externos?.nombre}</h3>
                   <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestionar Entrada Hoy</p>
                 </div>
                 <button
                   type="button"
                   onClick={() => abrirWhatsAppCliente({
                     id: entrenamientoACobrar.usuario_id,
                     nombre: entrenamientoACobrar.usuarios_externos?.nombre || "Cliente",
                     telefono: entrenamientoACobrar.usuarios_externos?.telefono,
                   }, "rapido")}
                   className="w-full bg-green-50 text-green-700 hover:bg-green-100 font-bold py-3 rounded-2xl transition-colors outline-none mb-4"
                 >
                   Enviar saldo por WhatsApp
                 </button>

                 <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                    <button onClick={() => setAccionCajaTipo('pago')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${accionCajaTipo === 'pago' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>Registrar Pago</button>
                    <button onClick={() => setAccionCajaTipo('nota')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${accionCajaTipo === 'nota' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}>Dejar Pendiente</button>
                 </div>

                 {accionCajaTipo === 'pago' ? (
                    <div className="animate-fade-in">
                      
                      {/* DETALLE DEL DÍA */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4 flex justify-between items-center shadow-sm">
                         <span className="font-bold text-gray-500 text-sm">Entrada de hoy</span>
                         <span className="font-black text-gray-800 text-xl">${montoHoy.toLocaleString('es-CO')}</span>
                      </div>

                      {/* LISTA DE DEUDAS ANTERIORES SI LAS HAY */}
                      {registrosAnteriores.length > 0 && (
                         <div className="mb-4 bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1"><IconoAlerta className="w-3 h-3"/> Días pendientes</p>
                            <div className="max-h-24 overflow-y-auto custom-scrollbar mb-2">
                                {registrosAnteriores.map((reg: any) => (
                                   <div key={reg.id} className="flex justify-between items-center text-sm py-1 border-b border-red-100/50 last:border-0">
                                       <span className="font-medium text-red-600 capitalize">{formatearFechaConDia(reg.fecha_asistencia)}</span>
                                       <span className="font-bold text-red-600">${reg.monto_generado.toLocaleString()}</span>
                                   </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2 mt-1 border-t border-red-200">
                               <span className="font-bold text-red-700">Total Atrasado</span>
                               <span className="font-black text-red-700">${deudaAnterior.toLocaleString('es-CO')}</span>
                            </div>
                         </div>
                      )}

                      {/* CONTROLES DE PAGO */}
                      <div className="bg-white p-4 rounded-2xl mb-4 border border-gray-200 shadow-sm">
                         <label className="block text-gray-500 font-bold mb-3 text-[10px] uppercase tracking-widest">¿Cuánto va a pagar?</label>
                         
                         <div className="flex gap-2 mb-3">
                            <button type="button" onClick={() => setMontoAbonoCaja(montoHoy)} className={`flex-1 border font-bold py-2.5 rounded-xl text-xs transition-colors outline-none ${montoAbonoCaja === montoHoy ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-500'}`}>
                               Solo Hoy
                            </button>
                            
                            {registrosAnteriores.length > 0 && (
                               <button type="button" onClick={() => setMontoAbonoCaja(montoTotalPagar)} className={`flex-1 border font-bold py-2.5 rounded-xl text-xs transition-colors outline-none ${montoAbonoCaja === montoTotalPagar ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-500'}`}>
                                 Pagar Todo
                               </button>
                            )}
                         </div>

                         <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400 font-black">$</span>
                            <input type="number" min="1" max={montoTotalPagar} required value={montoAbonoCaja} onChange={(e) => setMontoAbonoCaja(Number(e.target.value))} className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-black focus:outline-none focus:ring-2 focus:ring-green-200 text-lg" placeholder="O ingrese abono..." />
                         </div>
                      </div>

                      <div className="mb-6">
                         <label className="block text-gray-500 font-bold mb-2 text-[10px] uppercase tracking-widest ml-1">Medio de Pago</label>
                         <select value={metodoPagoAbono} onChange={e => setMetodoPagoAbono(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-bold outline-none focus:border-green-200">
                           <option value="Efectivo">💵 Efectivo</option>
                           <option value="Nequi">📱 Nequi</option>
                           <option value="Bancolombia">🏦 Bancolombia</option>
                           <option value="Daviplata">🔴 Daviplata</option>
                         </select>
                      </div>

                      <button onClick={confirmarAccionCaja} disabled={cargando || !montoAbonoCaja} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-md transition-all outline-none">
                        {cargando ? 'Procesando...' : `Confirmar Pago $${Number(montoAbonoCaja).toLocaleString('es-CO')}`}
                      </button>
                    </div>
                 ) : (
                    <div className="animate-fade-in">
                      <label className="block text-gray-500 font-bold mb-2 text-[10px] uppercase tracking-widest ml-1">Motivo / Nota</label>
                      <input type="text" value={notaIngreso} onChange={e => setNotaIngreso(e.target.value)} placeholder="Ej: Me paga mañana..." className="w-full bg-red-50/50 border border-red-100 p-4 rounded-2xl text-gray-800 font-medium mb-6 outline-none focus:border-red-300" />
                      <button onClick={confirmarAccionCaja} disabled={!notaIngreso || cargando} className="w-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 font-bold py-4 rounded-2xl transition-all outline-none">
                        Guardar Nota
                      </button>
                    </div>
                 )}
              </div>
            </div>
         );
      })()}

      {/* --- MODAL INTELIGENTE: PAGO TOTAL / ABONO AGRUPADO CON HISTORIAL --- */}
      {deudorSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button type="button" onClick={() => {setDeudorSeleccionado(null); setMontoAbono("");}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 outline-none"><IconoClose /></button>
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><IconoWallet /></div>
            <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1">{deudorSeleccionado.nombre}</h3>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Deuda Acumulada Activa</p>
            <p className="text-5xl font-black text-red-500 mb-6 tracking-tighter">${deudorSeleccionado.montoTotal.toLocaleString('es-CO')}</p>
            <button
              type="button"
              onClick={() => {
                const usuario = usuariosDB.find((u) => u.id === deudorSeleccionado.usuario_id);
                if (usuario) abrirWhatsAppCliente(usuario, "rapido");
              }}
              className="w-full bg-green-50 text-green-700 hover:bg-green-100 font-bold py-3 rounded-2xl transition-colors outline-none mb-4"
            >
              Enviar saldo por WhatsApp
            </button>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-40 overflow-y-auto custom-scrollbar">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historial de Clases Sin Pagar</p>
               {deudorSeleccionado.registros.map((reg: any) => (
                  <div key={reg.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-200 last:border-0">
                     <span className="font-bold text-gray-600 capitalize">{formatearFechaConDia(reg.fecha_asistencia)}</span>
                     <span className="font-black text-red-500">${reg.monto_generado.toLocaleString()}</span>
                  </div>
               ))}
            </div>

            <form onSubmit={procesarAbonoTotal}>
              <div className="bg-white p-4 rounded-2xl mb-6 border border-gray-200">
                <label className="block text-gray-500 font-bold mb-3 text-[10px] uppercase tracking-widest">¿Cuánto va a pagar?</label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setMontoAbono(deudorSeleccionado.montoTotal)} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm outline-none">Pagar Total</button>
                  <button type="button" onClick={() => setMontoAbono("")} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-500 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm outline-none">Otro monto</button>
                </div>
                <div className="relative">
                   <span className="absolute left-3 top-3 text-gray-400 font-black">$</span>
                   <input type="number" min="1" max={deudorSeleccionado.montoTotal} required value={montoAbono} onChange={(e) => setMontoAbono(Number(e.target.value))} className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-black focus:outline-none focus:ring-2 focus:ring-red-200 text-lg" placeholder="Ej: 15000" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-500 font-bold mb-2 text-[10px] uppercase tracking-widest ml-1">Método</label>
                <select value={metodoPagoAbono} onChange={(e) => setMetodoPagoAbono(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800 focus:outline-none focus:border-gray-300 font-bold outline-none">
                  <option value="Efectivo">💵 Efectivo</option><option value="Nequi">📱 Nequi</option><option value="Bancolombia">🏦 Bancolombia</option><option value="Daviplata">🔴 Daviplata</option>
                </select>
              </div>
              
              <button type="submit" disabled={cargando || !montoAbono} className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-all shadow-md outline-none">
                {cargando ? "Procesando..." : (montoAbono === deudorSeleccionado.montoTotal ? "Saldar Deuda Completa" : "Registrar Abono Parcial")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL INSCRIPCION / EDICION (BASE DE DATOS) --- */}
      {(mostrarModalInscripcion || mostrarModalEdicion) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button type="button" onClick={() => {setMostrarModalInscripcion(false); setMostrarModalEdicion(false); setUsuarioAEditar(null);}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 outline-none"><IconoClose /></button>
            <h3 className="text-2xl font-black text-gray-800 mb-2">{mostrarModalEdicion ? "Editar Atleta" : "Crear Ficha"}</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium">{mostrarModalEdicion ? "Modifica los datos del directorio." : "Agregar a la base de datos sin cobrar."}</p>
            
            <form onSubmit={mostrarModalEdicion ? editarUsuarioInfo : inscribirUsuario} className="space-y-4">
              <input type="text" required value={nombreInsc} onChange={(e) => setNombreInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium outline-none focus:ring-2 focus:ring-blue-100" placeholder="Nombre completo" />
              <input type="text" value={telefonoInsc} onChange={(e) => setTelefonoInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium outline-none focus:ring-2 focus:ring-blue-100" placeholder="Número de contacto" />
              <select value={tipoInsc} onChange={(e) => setTipoInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-bold outline-none focus:ring-2 focus:ring-blue-100">
                <option value="Gimnasta">Gimnasta</option>
                <option value="Cheer">Cheer</option>
                <option value="Bailarín">Bailarín</option>
                <option value="Acróbata">Acróbata</option>
                <option value="Profesor">Profesor Externo</option>
              </select>
              <button type="submit" disabled={cargando} className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-2xl mt-4 shadow-md outline-none transition-colors">
                {cargando ? "Guardando..." : "Guardar Ficha"}
              </button>
            </form>
          </div>
        </div>
      )}

      {dialogoApp && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-md w-full p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${dialogoApp.tipo === "error" ? "bg-red-50 text-red-500" : dialogoApp.tipo === "confirm" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
              {dialogoApp.tipo === "error" ? <IconoAlerta /> : dialogoApp.tipo === "confirm" ? <IconoCheck /> : <IconoWallet />}
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">{dialogoApp.titulo}</h3>
            <p className="text-sm font-medium text-gray-500 leading-relaxed whitespace-pre-line">{dialogoApp.mensaje}</p>
            <div className={`mt-6 grid gap-2 ${dialogoApp.tipo === "confirm" ? "grid-cols-2" : "grid-cols-1"}`}>
              {dialogoApp.tipo === "confirm" && (
                <button
                  type="button"
                  onClick={() => cerrarDialogo(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl transition-colors outline-none"
                >
                  {dialogoApp.textoCancelar || "Cancelar"}
                </button>
              )}
              <button
                type="button"
                onClick={() => cerrarDialogo(true)}
                className={`${dialogoApp.tipo === "error" ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"} text-white font-bold py-3 rounded-2xl transition-colors outline-none`}
              >
                {dialogoApp.textoConfirmar || "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
