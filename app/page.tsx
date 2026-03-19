"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Image from "next/image";

// --- COMPONENTES DE ÍCONOS PREMIUM (SVGs MODERNOS) ---
const IconoUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconoWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>;
const IconoTrend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>;
const IconoCheck = ({ className = "" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconoAlerta = ({ className = "" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconoSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconoClose = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconoStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconoTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>;
const IconoEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;
const IconoChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconoChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

export default function Home() {
  // --- CONTROL DE PANTALLAS ---
  const [pantalla, setPantalla] = useState('inicio'); 
  const [rolActivo, setRolActivo] = useState('asistente'); 
  const [vistaActiva, setVistaActiva] = useState('caja');

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
  const [estadisticasDias, setEstadisticasDias] = useState<{dia: string, cantidad: number}>({dia: '-', cantidad: 0});
  
  const [verDetalleDeuda, setVerDetalleDeuda] = useState(false);
  const [verDetallePagos, setVerDetallePagos] = useState(false);
  const [mostrarAnual, setMostrarAnual] = useState(false);
  const [topDeudores, setTopDeudores] = useState<any[]>([]);

  // --- ESTADOS DE MODALES ---
  const [mostrarModal, setMostrarModal] = useState(false);
  const [esNuevo, setEsNuevo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null); 
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState("Gimnasta"); 
  const [cantidadAtletas, setCantidadAtletas] = useState(1); 
  const [esIncentivo, setEsIncentivo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [ingresoExitoso, setIngresoExitoso] = useState(false); 

  const [busquedaUsuarioModal, setBusquedaUsuarioModal] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

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

  const procesarFinanzas = (registros: any[], mes: number, anio: number) => {
    let ingMes = 0; let ingSemana = 0; let deuda = 0; let ingAnual = 0;
    const clientesAgrupados: Record<string, any> = {};
    const conteoVisitasFidelidad: Record<string, number> = {};
    const deudoresAgrupados: Record<string, any> = {};
    const paquetesComprados: Record<string, number> = {};
    const paquetesUsados: Record<string, number> = {};
    const conteoDias: Record<number, number> = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};

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
        if (ent.metodo_pago === 'Compra Paquete (12)') paquetesComprados[uid] = (paquetesComprados[uid] || 0) + 12;
        if (ent.metodo_pago === 'Uso de Paquete') paquetesUsados[uid] = (paquetesUsados[uid] || 0) + 1;
        
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

    const clasesRest: Record<string, number> = {};
    Object.keys(paquetesComprados).forEach(uid => {
      clasesRest[uid] = paquetesComprados[uid] - (paquetesUsados[uid] || 0);
    });
    setClasesRestantesPaquete(clasesRest);

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

  const guardarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      let usuarioId = usuarioSeleccionado?.id;
      let tipoUs = tipo;

      if (esNuevo) {
        const { data: u, error: eU } = await supabase.from("usuarios_externos").insert([{ nombre, telefono, tipo_usuario: tipo }]).select().single();
        if (eU) throw eU;
        usuarioId = u.id; tipoUs = u.tipo_usuario;
      } else {
        tipoUs = usuarioSeleccionado?.tipo_usuario || "Gimnasta";
      }

      if (!usuarioId) throw new Error("Debes seleccionar un usuario.");

      const esProfesor = tipoUs === "Profesor";
      const clasesQueLeQuedan = clasesRestantesPaquete[usuarioId] || 0;
      const usarPaquete = (clasesQueLeQuedan > 0 && !esProfesor);

      const visitasPrevias = visitasPorUsuario[usuarioId] || 0;
      const esCortesiaFidelidad = !esProfesor && !usarPaquete && (visitasPrevias % 11 === 10); 
      const cant = !esProfesor ? 1 : cantidadAtletas;
      
      let monto = 0; let estado = "Pendiente"; let metodo = null;

      if (usarPaquete) {
        monto = 0; estado = "Pagado"; metodo = "Uso de Paquete";
      } else if (esIncentivo) {
        monto = 0; estado = "Pagado"; metodo = "Incentivo Habilidad";
      } else if (esCortesiaFidelidad) {
        monto = 0; estado = "Pagado"; metodo = "Cortesía Fidelidad";
      } else {
        monto = !esProfesor ? 10000 : (tarifaPorAtletaProfesor * cantidadAtletas);
        estado = "Pendiente";
      }

      const { error: eR } = await supabase.from("registro_entrenamientos").insert([{ 
        usuario_id: usuarioId, cantidad_atletas: cant, monto_generado: monto, estado_pago: estado, metodo_pago: metodo, fecha_asistencia: fechaCaja 
      }]);
      if (eR) throw eR;

      setIngresoExitoso(true);
      setTimeout(() => setIngresoExitoso(false), 2000);
      
      setNombre(""); setTelefono(""); setCantidadAtletas(1); setUsuarioSeleccionado(null); setBusquedaUsuarioModal(""); setEsIncentivo(false);
      
      if (estado === "Pagado") setFiltroCaja("pagados");
      else setFiltroCaja("pendientes");

      cargarDatos();
    } catch (error) { alert("Error: " + (error as Error).message); } 
    finally { setCargando(false); }
  };

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
    } catch (error) { alert("Error al actualizar: " + (error as Error).message); }
    finally { setCargando(false); }
  };

  const venderPaquete = async (uid: string) => {
    if (!window.confirm("¿Confirmar venta de paquete de 12 clases por $90.000? (Se registrará como pagado hoy)")) return;
    try {
      const { error } = await supabase.from("registro_entrenamientos").insert([{ 
        usuario_id: uid, cantidad_atletas: 0, monto_generado: tarifaPaquete, estado_pago: 'Pagado', metodo_pago: 'Compra Paquete (12)', fecha_asistencia: getFechaLocal(new Date()) 
      }]);
      if (error) throw error;
      cargarDatos();
    } catch (error) { alert("Error al activar paquete."); }
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
    } catch (error) { alert("Error: " + (error as Error).message); }
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
    } catch (error) { alert("Error: " + (error as Error).message); } 
    finally { setCargando(false); }
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
    } catch (error) { alert("Error al editar: " + (error as Error).message); } 
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
    if (!window.confirm(`ATENCIÓN: ¿Estás seguro de eliminar a ${nombre}? (Perderás todo su historial)`)) return;
    try {
      const { error } = await supabase.from('usuarios_externos').delete().eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch (error) { alert("No se puede eliminar (probablemente tenga registros en el historial)."); }
  };

  const eliminarIngreso = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas ELIMINAR por completo este registro?")) return;
    try {
      const { error } = await supabase.from('registro_entrenamientos').delete().eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch (error) { alert("Error al eliminar"); }
  };

  const reversarPago = async (id: number) => {
    if (!window.confirm("¿Estás seguro que deseas anular este pago? Volverá a aparecer como DEUDA.")) return;
    try {
      const { error } = await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pendiente', metodo_pago: null }).eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch (error) { alert("Error al anular: " + (error as Error).message); }
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

  const usuariosModalFiltrados = useMemo(() => {
    if (!busquedaUsuarioModal) return usuariosDB;
    return usuariosDB.filter(u => u.nombre.toLowerCase().includes(busquedaUsuarioModal.toLowerCase()));
  }, [busquedaUsuarioModal, usuariosDB]);

  // --- RENDERING PRINCIPAL ---
  if (pantalla === 'inicio') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-200">
        <div className="bg-white p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-3xl w-full text-center border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-900"></div>
          <div className="flex justify-center mb-8">
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 inline-block">
               <Image src="/logo.png" alt="Logo Gimnasio" width={110} height={110} className="object-contain" priority />
             </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-blue-950 mb-3">Control <span className="text-blue-600">Externo</span></h1>
          <p className="text-gray-400 font-medium mb-12">Plataforma de gestión inteligente</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={entrarComoAsistente} className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-lg py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
              <div className="text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300"><IconoUser /></div>
              <span className="text-xl font-bold text-gray-800">Recepción</span>
            </button>
            <button onClick={() => setPantalla('login')} className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-lg py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
              <div className="text-blue-950 mb-4 group-hover:scale-110 transition-transform duration-300"><IconoWallet /></div>
              <span className="text-xl font-bold text-gray-800">Administración</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (pantalla === 'login') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-sm w-full text-center border border-gray-100 relative">
          <button onClick={() => setPantalla('inicio')} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 font-medium transition-colors outline-none">← Atrás</button>
          <div className="flex justify-center mb-6 mt-4"><div className="bg-blue-50 text-blue-600 p-4 rounded-3xl"><IconoWallet /></div></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Seguro</h2>
          <p className="text-gray-400 text-sm mb-8">Ingresa tu PIN de administrador</p>
          <form onSubmit={iniciarSesionAdmin}>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-center text-3xl tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white mb-6 text-gray-800 transition-all outline-none" placeholder="••••" />
            {errorLogin && <p className="text-red-500 font-medium mb-6 text-sm bg-red-50 py-2 rounded-xl">PIN incorrecto</p>}
            <button type="submit" className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-2xl shadow-md transition-all outline-none">Verificar</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-10">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 flex-shrink-0">
               <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-blue-950 leading-none">ELITE <span className="text-blue-600">SYSTEM</span></h1>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full mt-1 inline-block ${rolActivo === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>Sesión: {rolActivo}</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 overflow-x-auto w-full md:w-auto hide-scrollbar">
            <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200">
              <button onClick={() => setVistaActiva('caja')} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap outline-none ${vistaActiva === 'caja' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Caja Diaria</button>
              {rolActivo === 'admin' && (
                <>
                  <button onClick={() => setVistaActiva('finanzas')} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap outline-none ${vistaActiva === 'finanzas' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Finanzas</button>
                  <button onClick={() => setVistaActiva('basedatos')} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap outline-none ${vistaActiva === 'basedatos' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Directorio</button>
                </>
              )}
            </div>
            <button onClick={cerrarSesion} className="ml-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold p-3 rounded-2xl transition-colors outline-none" title="Cerrar Sesión">
              <IconoClose />
            </button>
          </nav>
        </div>
      </header>

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
               
               <button onClick={() => {setMostrarModal(true); setEsIncentivo(false); setIngresoExitoso(false);}} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-md transition-all outline-none">
                 Nueva Entrada +
               </button>
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
                     <p className="text-xs font-medium text-red-400 mt-3 inline-block bg-red-50 px-2 py-1 rounded-md">{d.registros.length} entradas</p>
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
                       <button className="w-full bg-red-50 text-red-600 font-bold py-2 rounded-xl text-sm transition-colors hover:bg-red-100 outline-none">Saldar Deuda</button>
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

      {/* --- AQUÍ ESTÁ EL BLOQUE RESTAURADO: DIRECTORIO DE ATLETAS --- */}
      {vistaActiva === 'basedatos' && rolActivo === 'admin' && (
        <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
            <div><h2 className="text-3xl font-black text-gray-800 tracking-tight">Directorio de Atletas</h2></div>
            <button onClick={() => setMostrarModalInscripcion(true)} className="bg-blue-950 hover:bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center outline-none">+ Inscribir Cliente</button>
          </div>
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</th><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Paquete</th><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usuariosDB.map((u, i) => {
                    const clasesLeft = clasesRestantesPaquete[u.id] || 0;
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5"><p className="font-bold text-gray-800">{u.nombre}</p><p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{u.telefono || 'Sin contacto'} • {u.tipo_usuario}</p></td>
                        <td className="p-5 text-center">
                          {u.tipo_usuario !== 'Profesor' ? (
                            clasesLeft > 0 ? <span className="bg-green-100 text-green-700 font-black px-3 py-1.5 rounded-xl">{clasesLeft} Clases</span> : <button onClick={() => venderPaquete(u.id)} className="bg-gray-100 hover:bg-green-50 text-gray-500 hover:text-green-600 font-bold px-4 py-2 rounded-xl text-xs transition-colors border border-gray-200 outline-none">Vender Paquete</button>
                          ) : <span className="text-gray-300 text-xs font-bold">No Aplica</span>}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2">
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

      {/* --- MODAL ASISTENCIA EXPRESS --- */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-visible">
            
            {ingresoExitoso && (
              <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center animate-fade-in rounded-[2.5rem]">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-500"><IconoCheck className="w-10 h-10"/></div>
                <h3 className="text-2xl font-black text-gray-800">¡Guardado!</h3>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">Toma de Asistencia</h3>
              <button type="button" onClick={() => setMostrarModal(false)} className="bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold outline-none"><IconoClose /></button>
            </div>
            
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
              <button onClick={() => setEsNuevo(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all outline-none ${!esNuevo ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Registrado</button>
              <button onClick={() => setEsNuevo(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all outline-none ${esNuevo ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Nuevo Fichaje</button>
            </div>
            
            <form onSubmit={guardarIngreso} className="space-y-4">
              {!esNuevo ? (
                <div className="relative">
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-gray-400"><IconoSearch /></span>
                    <input type="text" placeholder="Buscar por nombre..." value={usuarioSeleccionado ? usuarioSeleccionado.nombre : busquedaUsuarioModal} onChange={(e) => { setBusquedaUsuarioModal(e.target.value); setUsuarioSeleccionado(null); setMostrarDropdown(true); }} onFocus={() => setMostrarDropdown(true)} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium" />
                  </div>
                  
                  {mostrarDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                      {usuariosModalFiltrados.map((u) => {
                        const isPaquete = clasesRestantesPaquete[u.id] > 0;
                        return (
                          <div key={u.id} onClick={() => { setUsuarioSeleccionado(u); setBusquedaUsuarioModal(u.nombre); setMostrarDropdown(false); }} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 flex justify-between items-center transition-colors">
                            <div><p className="font-bold text-gray-800">{u.nombre}</p><p className="text-[10px] uppercase font-bold text-gray-400">{u.tipo_usuario}</p></div>
                            {isPaquete && <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-md">Paquete</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium outline-none focus:ring-2 focus:ring-blue-100" placeholder="Nombre completo" />
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium outline-none focus:ring-2 focus:ring-blue-100" placeholder="Teléfono" />
                  
                  <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCantidadAtletas(1); }} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-bold outline-none focus:ring-2 focus:ring-blue-100">
                    <optgroup label="Atletas ($10k o Paquete)">
                       <option value="Gimnasta">Gimnasta</option>
                       <option value="Cheer">Cheer</option>
                       <option value="Bailarín">Bailarín</option>
                       <option value="Acróbata">Acróbata</option>
                    </optgroup>
                    <optgroup label="Staff">
                       <option value="Profesor">Profesor Externo</option>
                    </optgroup>
                  </select>
                </div>
              )}
              
              {(tipo === "Profesor" || usuarioSeleccionado?.tipo_usuario === "Profesor") && (
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 animate-fade-in">
                  <label className="block text-blue-900 font-bold mb-3 text-sm uppercase tracking-wider">Atletas a cargo hoy:</label>
                  <input type="number" min="1" required value={cantidadAtletas} onChange={(e) => setCantidadAtletas(Number(e.target.value))} className="w-full bg-white border border-blue-200 p-4 rounded-xl text-gray-800 font-black focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              )}

              <div className="flex items-center gap-3 bg-yellow-50 hover:bg-yellow-100 p-4 rounded-2xl border border-yellow-200 cursor-pointer transition-colors mt-2" onClick={() => setEsIncentivo(!esIncentivo)}>
                 <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${esIncentivo ? 'bg-yellow-500 border-yellow-500' : 'bg-white border-yellow-300'}`}>
                   {esIncentivo && <IconoCheck className="text-white w-3 h-3" />}
                 </div>
                 <label className="text-sm font-bold text-yellow-700 cursor-pointer">Otorgar Cortesía Especial</label>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={cargando || (!esNuevo && !usuarioSeleccionado)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl transition-all shadow-md text-lg outline-none">
                  {cargando ? "Registrando..." : "Guardar Entrada Hoy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

    </main>
  );
}