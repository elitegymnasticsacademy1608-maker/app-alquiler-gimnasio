"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Image from "next/image";

export default function Home() {
  // --- CONTROL DE PANTALLAS ---
  const [pantalla, setPantalla] = useState('inicio'); 
  const [rolActivo, setRolActivo] = useState('asistente'); 
  const [vistaActiva, setVistaActiva] = useState('caja');

  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState(false);
  const CLAVE_ADMIN = "elite2026";

  const entrarComoAsistente = () => { setRolActivo('asistente'); setVistaActiva('caja'); setPantalla('app'); };
  const iniciarSesionAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (clave === CLAVE_ADMIN) { setRolActivo('admin'); setVistaActiva('caja'); setPantalla('app'); setErrorLogin(false); setClave(""); } 
    else { setErrorLogin(true); }
  };
  const cerrarSesion = () => { setPantalla('inicio'); setRolActivo('asistente'); };

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
  const [topDeudores, setTopDeudores] = useState<any[]>([]);

  // --- ESTADOS DE MODALES ---
  const [mostrarModal, setMostrarModal] = useState(false);
  const [esNuevo, setEsNuevo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null); 
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState("Libre"); 
  const [cantidadAtletas, setCantidadAtletas] = useState(1); 
  const [esIncentivo, setEsIncentivo] = useState(false);
  const [notaIngreso, setNotaIngreso] = useState(""); // NUEVO: Estado para la nota
  const [cargando, setCargando] = useState(false);
  const [ingresoExitoso, setIngresoExitoso] = useState(false); 

  // Buscador personalizado para nuevo ingreso
  const [busquedaUsuarioModal, setBusquedaUsuarioModal] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [mostrarModalInscripcion, setMostrarModalInscripcion] = useState(false);
  const [nombreInsc, setNombreInsc] = useState("");
  const [telefonoInsc, setTelefonoInsc] = useState("");
  const [tipoInsc, setTipoInsc] = useState("Libre");

  // Modal de Abonos y Cobros
  const [deudorSeleccionado, setDeudorSeleccionado] = useState<any>(null);
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [metodoPagoAbono, setMetodoPagoAbono] = useState("Efectivo");

  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [entrenamientoACobrar, setEntrenamientoACobrar] = useState<any>(null);

  // Filtros
  const [filtroCaja, setFiltroCaja] = useState('pendientes');
  const [busquedaCaja, setBusquedaCaja] = useState("");
  const [busquedaDeuda, setBusquedaDeuda] = useState("");
  const [mesConsulta, setMesConsulta] = useState(new Date().getMonth());
  const [anioConsulta, setAnioConsulta] = useState(new Date().getFullYear());
  
  const mesesDelAno = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const tarifaPorAtletaProfesor = 10000; 
  const tarifaPaquete = 90000; 

  const obtenerFechaHoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const formatearFechaConDia = (fechaStr: string) => {
    if (!fechaStr) return '';
    const d = new Date(fechaStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

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
      const tipoUsuarioBD = ent.usuarios_externos?.tipo_usuario?.trim() || '-';

      if (ent.cantidad_atletas > 0) conteoDias[fechaEnt.getDay()] += Number(ent.cantidad_atletas);

      if (uid) {
        if (ent.metodo_pago === 'Compra Paquete (12)') paquetesComprados[uid] = (paquetesComprados[uid] || 0) + 12;
        if (ent.metodo_pago === 'Uso de Paquete') paquetesUsados[uid] = (paquetesUsados[uid] || 0) + 1;
        
        if (!clientesAgrupados[uid]) {
          clientesAgrupados[uid] = { nombre: ent.usuarios_externos?.nombre || 'Desconocido', telefono: ent.usuarios_externos?.telefono || '-', tipo: tipoUsuarioBD, totalPagado: 0, visitasTotales: 0 };
        }
        if (ent.cantidad_atletas > 0) clientesAgrupados[uid].visitasTotales += 1;
        if (tipoUsuarioBD === "Libre" && ent.cantidad_atletas > 0) conteoVisitasFidelidad[uid] = (conteoVisitasFidelidad[uid] || 0) + 1;
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
      const hoyStr = obtenerFechaHoy(); 
      const { data: hoyData } = await supabase.from('registro_entrenamientos').select(`id, monto_generado, estado_pago, metodo_pago, cantidad_atletas, fecha_asistencia, usuario_id, usuarios_externos (nombre, telefono, tipo_usuario)`).eq('fecha_asistencia', hoyStr).order('id', { ascending: false });
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

  useEffect(() => { if (pantalla === 'app') cargarDatos(); }, [pantalla, mesConsulta, anioConsulta]);

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
        tipoUs = usuarioSeleccionado?.tipo_usuario || "Libre";
      }

      if (!usuarioId) throw new Error("Debes seleccionar un usuario.");

      const clasesQueLeQuedan = clasesRestantesPaquete[usuarioId] || 0;
      const usarPaquete = (clasesQueLeQuedan > 0 && tipoUs === "Libre");

      const visitasPrevias = visitasPorUsuario[usuarioId] || 0;
      const esCortesiaFidelidad = tipoUs === "Libre" && !usarPaquete && (visitasPrevias % 11 === 10); 
      const cant = tipoUs === "Libre" ? 1 : cantidadAtletas;
      
      let monto = 0; let estado = "Pendiente"; let metodo = null;

      if (usarPaquete) {
        monto = 0; estado = "Pagado"; metodo = "Uso de Paquete";
      } else if (esIncentivo) {
        monto = 0; estado = "Pagado"; metodo = "Incentivo Habilidad";
      } else if (esCortesiaFidelidad) {
        monto = 0; estado = "Pagado"; metodo = "Cortesía Fidelidad";
      } else {
        monto = tipoUs === "Libre" ? 10000 : (tarifaPorAtletaProfesor * cantidadAtletas);
        estado = "Pendiente";
        metodo = notaIngreso ? `Nota: ${notaIngreso}` : null; // Aquí guardamos la nota
      }

      const { error: eR } = await supabase.from("registro_entrenamientos").insert([{ 
        usuario_id: usuarioId, cantidad_atletas: cant, monto_generado: monto, estado_pago: estado, metodo_pago: metodo, fecha_asistencia: obtenerFechaHoy() 
      }]);
      if (eR) throw eR;

      setIngresoExitoso(true);
      setTimeout(() => setIngresoExitoso(false), 2000);
      
      setNombre(""); setTelefono(""); setCantidadAtletas(1); setUsuarioSeleccionado(null); setBusquedaUsuarioModal(""); setEsIncentivo(false); setNotaIngreso("");
      
      if (estado === "Pagado") setFiltroCaja("pagados");
      else setFiltroCaja("pendientes");

      cargarDatos();
    } catch (error) { alert("Error: " + (error as Error).message); } 
    finally { setCargando(false); }
  };

  const venderPaquete = async (uid: string) => {
    if (!window.confirm("¿Confirmar venta de paquete de 12 clases por $90.000? (Se registrará como pagado hoy)")) return;
    try {
      const { error } = await supabase.from("registro_entrenamientos").insert([{ 
        usuario_id: uid, cantidad_atletas: 0, monto_generado: tarifaPaquete, estado_pago: 'Pagado', metodo_pago: 'Compra Paquete (12)', fecha_asistencia: obtenerFechaHoy() 
      }]);
      if (error) throw error;
      alert("¡Paquete activado! Tienen 12 clases disponibles.");
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
            usuario_id: deuda.usuario_id, cantidad_atletas: 0, monto_generado: abono, estado_pago: 'Pagado', metodo_pago: `Abono Parcial (${metodoPagoAbono})`, fecha_asistencia: obtenerFechaHoy()
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

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (!window.confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de eliminar a ${nombre}? (Perderás todo su historial)`)) return;
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

  const procesarPagoUnitario = async () => {
    try {
      const { error } = await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pagado', metodo_pago: metodoPagoAbono }).eq('id', entrenamientoACobrar.id);
      if (error) throw error;
      setMostrarModalCobro(false);
      cargarDatos(); 
    } catch (error) { alert("Error: " + (error as Error).message); }
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
  const porcentajeRecaudo = totalEsperadoHoy === 0 ? 0 : Math.round((totalRecaudadoHoy / totalEsperadoHoy) * 100);

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

  if (pantalla === 'inicio') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-200">
        <div className="bg-white p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-3xl w-full text-center border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-blue-900"></div>
          <div className="flex justify-center mb-8">
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 inline-block">
               <Image src="/logo.png" alt="Logo Gimnasio" width={110} height={110} className="object-contain" priority />
             </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-blue-950 mb-3">Control <span className="text-red-600">Externo</span></h1>
          <p className="text-gray-400 font-medium mb-12">Plataforma de gestión inteligente</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={entrarComoAsistente} className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-lg py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📝</span>
              <span className="text-xl font-bold text-gray-800">Recepción</span>
            </button>
            <button onClick={() => setPantalla('login')} className="group bg-white border border-gray-200 hover:border-red-500 hover:shadow-lg py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔐</span>
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
          <button onClick={() => setPantalla('inicio')} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 font-medium transition-colors">← Atrás</button>
          <div className="flex justify-center mb-6 mt-4"><div className="bg-blue-50 p-4 rounded-3xl"><span className="text-4xl">🔐</span></div></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Seguro</h2>
          <p className="text-gray-400 text-sm mb-8">Ingresa tu PIN de administrador</p>
          <form onSubmit={iniciarSesionAdmin}>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-center text-3xl tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white mb-6 text-gray-800 transition-all" placeholder="••••" />
            {errorLogin && <p className="text-red-500 font-medium mb-6 text-sm bg-red-50 py-2 rounded-xl">PIN incorrecto</p>}
            <button type="submit" className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-2xl shadow-md transition-all">Verificar</button>
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
              <h1 className="text-xl font-black tracking-tight text-blue-950 leading-none">CONTROL <span className="text-red-600">EXTERNO</span></h1>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full mt-1 inline-block ${rolActivo === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>Sesión: {rolActivo}</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 overflow-x-auto w-full md:w-auto hide-scrollbar">
            <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200">
              <button onClick={() => setVistaActiva('caja')} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'caja' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Caja Diaria</button>
              {rolActivo === 'admin' && (
                <>
                  <button onClick={() => setVistaActiva('finanzas')} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'finanzas' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Finanzas</button>
                  <button onClick={() => setVistaActiva('basedatos')} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'basedatos' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Base de Datos</button>
                </>
              )}
            </div>
            <button onClick={cerrarSesion} className="ml-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold p-3 rounded-2xl transition-colors" title="Cerrar Sesión">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </nav>
        </div>
      </header>

      {vistaActiva === 'caja' && (
        <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
          
          {/* DASHBOARD RESUMEN DIARIO */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
               <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Caja de Hoy</h2>
                  <span className="text-gray-400 font-medium capitalize mt-1 block">{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
               </div>
               <button onClick={() => {setMostrarModal(true); setEsIncentivo(false); setIngresoExitoso(false);}} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 w-full md:w-auto justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Toma de Asistencia
               </button>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Entradas Hoy</p>
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

             <div className="mt-6 flex items-center gap-4">
               <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                 <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${porcentajeRecaudo}%` }}></div>
               </div>
               <span className="text-sm font-bold text-gray-500 whitespace-nowrap">{porcentajeRecaudo}% Pagado</span>
             </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex bg-gray-200/50 p-1.5 rounded-2xl w-full md:w-auto">
               <button onClick={() => setFiltroCaja('pendientes')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${filtroCaja === 'pendientes' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 Falta cobrar
               </button>
               <button onClick={() => setFiltroCaja('pagados')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${filtroCaja === 'pagados' ? 'bg-white text-green-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 Ya pagaron
               </button>
            </div>
            <div className="relative w-full md:w-80">
               <span className="absolute left-4 top-3.5 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
               <input type="text" placeholder="Buscar entrada hoy..." value={busquedaCaja} onChange={(e) => setBusquedaCaja(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none text-gray-800 transition-all bg-white" />
            </div>
          </div>

          {cargandoLista ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {entrenamientosFiltrados.map((item, i) => (
                <div key={i} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col relative transition-all hover:shadow-md">
                  <div className={`px-5 py-4 font-bold flex justify-between items-center border-b border-gray-50 ${item.estado_pago === 'Pendiente' ? 'bg-red-50/50' : 'bg-green-50/50'}`}>
                    <span className="truncate text-gray-800 text-lg">{item.usuarios_externos?.nombre || 'Desconocido'}</span>
                    <button onClick={() => eliminarIngreso(item.id)} className="text-gray-300 hover:text-red-500 transition-colors rounded-full p-1" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                  </div>
                  <div className="p-5 flex-grow text-gray-600">
                    <p className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-lg inline-block text-gray-500 mb-2">{item.usuarios_externos?.tipo_usuario}</p>
                    <p className="text-3xl font-black text-gray-800 mt-2">${item.monto_generado.toLocaleString('es-CO')}</p>
                    {item.estado_pago === 'Pagado' && item.monto_generado > 0 && <p className="text-xs text-gray-400 font-bold mt-2">✅ Pagó con {item.metodo_pago}</p>}
                    {item.estado_pago === 'Pagado' && item.monto_generado === 0 && <p className="text-xs text-green-600 font-bold mt-2">⭐ {item.metodo_pago}</p>}
                    {/* AQUI SE MUESTRA LA NOTA SI ESTÁ DEBIENDO */}
                    {item.estado_pago === 'Pendiente' && item.metodo_pago && item.metodo_pago.startsWith('Nota:') && (
                       <p className="text-xs text-red-500 font-bold mt-2 bg-red-50 p-2 rounded-lg">⚠️ {item.metodo_pago.substring(6)}</p>
                    )}
                  </div>
                  {item.estado_pago === 'Pendiente' ? (
                    <div className="p-4 pt-0">
                       <button onClick={() => { 
                         // Si lo toca, abre la modal de deuda agrupada o unitaria
                         const deudorData = listaDeudoresAgrupados.find(d => d.usuario_id === item.usuario_id);
                         if(deudorData && deudorData.registros.length > 1) {
                           setDeudorSeleccionado(deudorData);
                         } else {
                           setEntrenamientoACobrar(item); setMostrarModalCobro(true);
                         }
                       }} className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm">
                         Cobrar / Ver Deuda
                       </button>
                    </div>
                  ) : (
                    <div className="p-4 pt-0">
                       <button onClick={() => reversarPago(item.id)} className="w-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 font-bold py-3 rounded-xl transition-colors text-xs border border-gray-100">
                         Anular (Volver a Pendiente)
                       </button>
                    </div>
                  )}
                </div>
              ))}
              {entrenamientosFiltrados.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-16 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                  <p className="text-lg font-medium">{busquedaCaja ? "Sin resultados" : (filtroCaja === 'pendientes' ? "¡Caja limpia! Todos han pagado." : "Aún no hay cobros hoy.")}</p>
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-950 p-5 rounded-3xl text-white shadow-lg col-span-2 md:col-span-1 flex flex-col justify-center">
              <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">Día más popular</p>
              <p className="text-2xl font-black">{estadisticasDias.dia}</p>
              <p className="text-sm font-medium text-blue-400 mt-1">{estadisticasDias.cantidad} asistencias max</p>
            </div>
            
            <div onClick={() => { setVerDetallePagos(true); setVerDetalleDeuda(false); }} className={`p-5 rounded-3xl border cursor-pointer flex flex-col justify-center col-span-2 ${verDetallePagos ? 'bg-white border-blue-500 shadow-md ring-4 ring-blue-50' : 'bg-white border-gray-100 hover:border-blue-300 shadow-sm'}`}>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total {mesesDelAno[mesConsulta]} {anioConsulta}</p>
              <p className="text-3xl font-black text-gray-800">${finanzas.mensual.toLocaleString('es-CO')}</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col justify-center col-span-2">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Recaudo Anual ({anioConsulta})</p>
              <p className="text-3xl font-black text-gray-800">${finanzas.anual.toLocaleString('es-CO')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
             <div onClick={() => { setVerDetalleDeuda(true); setVerDetallePagos(false); }} className={`p-6 rounded-3xl border cursor-pointer flex items-center justify-between ${verDetalleDeuda ? 'bg-red-500 border-red-500 shadow-lg' : 'bg-white border-red-100 hover:border-red-300 shadow-sm'}`}>
                <div>
                   <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${verDetalleDeuda ? 'text-red-200' : 'text-red-400'}`}>Cartera Pendiente Total</p>
                   <p className={`text-4xl font-black ${verDetalleDeuda ? 'text-white' : 'text-red-500'}`}>${finanzas.deudaTotal.toLocaleString('es-CO')}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${verDetalleDeuda ? 'bg-white/20 text-white' : 'bg-red-50 text-red-500'}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg></div>
             </div>
          </div>

          {topDeudores.length > 0 && !verDetalleDeuda && !verDetallePagos && (
             <div className="mb-10 animate-fade-in">
               <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span className="bg-red-100 text-red-500 p-1.5 rounded-lg">⚠️</span> Mayores Deudores (Toca para cobrar)
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 {topDeudores.slice(0, 4).map((d, i) => (
                   <div key={i} onClick={() => setDeudorSeleccionado(d)} className="bg-white p-5 rounded-3xl border border-red-100 shadow-sm cursor-pointer hover:shadow-md hover:border-red-300 transition-all">
                     <p className="font-bold text-gray-800 truncate">{d.nombre}</p>
                     <p className="text-2xl font-black text-red-500 mt-2">${d.montoTotal.toLocaleString('es-CO')}</p>
                     <p className="text-xs font-medium text-red-400 mt-3 inline-block bg-red-50 px-2 py-1 rounded-md">{d.registros.length} entradas ➔</p>
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
                   <span className="absolute left-4 top-3 text-gray-400">🔍</span>
                   <input type="text" placeholder="Buscar por nombre..." value={busquedaDeuda} onChange={(e) => setBusquedaDeuda(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:border-red-200 focus:bg-white focus:outline-none text-gray-800 transition-all text-sm font-medium" />
                 </div>
              </div>

              {listaDeudoresAgrupados.length === 0 ? (
                 <div className="text-center py-10"><p className="text-gray-400 font-medium">Nadie debe dinero.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deudoresFiltrados.map((d, i) => (
                    <div key={i} onClick={() => setDeudorSeleccionado(d)} className="bg-white border border-gray-100 hover:border-red-200 shadow-sm hover:shadow-md transition-all rounded-3xl p-5 cursor-pointer">
                       <div className="flex justify-between items-start mb-4">
                         <h4 className="font-bold text-gray-800 leading-tight pr-2">{d.nombre}</h4>
                         <span className="bg-red-50 text-red-500 font-bold text-xs px-2 py-1 rounded-lg">{d.registros.length} clases</span>
                       </div>
                       <p className="text-3xl font-black text-red-500 mb-4">${d.montoTotal.toLocaleString('es-CO')}</p>
                       <button className="w-full bg-red-50 text-red-600 font-bold py-2 rounded-xl text-sm transition-colors hover:bg-red-100">Cobrar / Abonar</button>
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
                 <div className="text-center py-10"><p className="text-gray-400 font-medium">Aún no hay pagos.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr><th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Cliente</th><th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-center">Visitas</th><th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Aportado</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {resumenClientes.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4"><p className="font-bold text-gray-800">{c.nombre}</p><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block">{c.tipo}</span></td>
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

      {vistaActiva === 'basedatos' && rolActivo === 'admin' && (
        <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
            <div><h2 className="text-3xl font-black text-gray-800 tracking-tight">Directorio</h2></div>
            <button onClick={() => setMostrarModalInscripcion(true)} className="bg-blue-950 hover:bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center">+ Inscribir Cliente</button>
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
                        <td className="p-5"><p className="font-bold text-gray-800">{u.nombre}</p><p className="text-xs text-gray-400 font-medium mt-1">{u.telefono || 'Sin contacto'} - {u.tipo_usuario}</p></td>
                        <td className="p-5 text-center">
                          {u.tipo_usuario === 'Libre' ? (
                            clasesLeft > 0 ? <span className="bg-green-100 text-green-700 font-black px-3 py-1.5 rounded-xl">{clasesLeft} Clases</span> : <button onClick={() => venderPaquete(u.id)} className="bg-gray-100 hover:bg-green-50 text-gray-500 hover:text-green-600 font-bold px-4 py-2 rounded-xl text-xs transition-colors border border-gray-200">Vender Paquete</button>
                          ) : <span className="text-gray-300 text-xs font-bold">No Aplica</span>}
                        </td>
                        <td className="p-5 text-right"><button onClick={() => eliminarUsuario(u.id, u.nombre)} className="text-gray-300 hover:text-red-500 font-bold p-2 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar Usuario">🗑️</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ASISTENCIA "MODO RÁFAGA Y BUSCADOR" --- */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-visible">
            
            {ingresoExitoso && (
              <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center animate-fade-in rounded-[2rem]">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 text-5xl">✅</div>
                <h3 className="text-2xl font-black text-gray-800">¡Guardado!</h3>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">Toma de Asistencia</h3>
              <button type="button" onClick={() => setMostrarModal(false)} className="bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>
            
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
              <button onClick={() => setEsNuevo(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!esNuevo ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Registrado</button>
              <button onClick={() => setEsNuevo(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${esNuevo ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Nuevo Fichaje</button>
            </div>
            
            <form onSubmit={guardarIngreso} className="space-y-4">
              {!esNuevo ? (
                <div className="relative">
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-gray-400">🔍</span>
                    <input type="text" placeholder="Buscar por nombre..." value={usuarioSeleccionado ? usuarioSeleccionado.nombre : busquedaUsuarioModal} onChange={(e) => { setBusquedaUsuarioModal(e.target.value); setUsuarioSeleccionado(null); setMostrarDropdown(true); }} onFocus={() => setMostrarDropdown(true)} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium" />
                  </div>
                  
                  {mostrarDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                      {usuariosModalFiltrados.map((u) => {
                        const isPaquete = clasesRestantesPaquete[u.id] > 0;
                        return (
                          <div key={u.id} onClick={() => { setUsuarioSeleccionado(u); setBusquedaUsuarioModal(u.nombre); setMostrarDropdown(false); }} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 flex justify-between items-center transition-colors">
                            <div><p className="font-bold text-gray-800">{u.nombre}</p><p className="text-xs text-gray-400">{u.tipo_usuario}</p></div>
                            {isPaquete && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">Tiene Paquete</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {usuarioSeleccionado && (clasesRestantesPaquete[usuarioSeleccionado.id] > 0) && (
                    <div className="mt-3 bg-green-50 border border-green-200 p-4 rounded-xl flex justify-between items-center">
                      <p className="text-sm font-bold text-green-700">⭐ Paquete Activo</p>
                      <span className="bg-white text-green-600 text-xs font-black px-2 py-1 rounded-lg border border-green-100">{clasesRestantesPaquete[usuarioSeleccionado.id]} clases left</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium" placeholder="Nombre completo" />
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium" placeholder="Teléfono o Nequi" />
                  <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCantidadAtletas(1); }} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-bold">
                    <option value="Libre">Entrenamiento Libre ($10.000)</option><option value="Profesor">Profesor Externo</option>
                  </select>
                </div>
              )}
              
              {(tipo === "Profesor" || usuarioSeleccionado?.tipo_usuario === "Profesor") && (
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 animate-fade-in">
                  <label className="block text-blue-900 font-bold mb-3 text-sm">Atletas a cargo hoy:</label>
                  <input type="number" min="1" required value={cantidadAtletas} onChange={(e) => setCantidadAtletas(Number(e.target.value))} className="w-full bg-white border border-blue-200 p-4 rounded-xl text-gray-800 font-black focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              )}

              {/* NUEVO: CAMPO DE NOTA OPCIONAL */}
              <div className="animate-fade-in">
                <input type="text" value={notaIngreso} onChange={(e) => setNotaIngreso(e.target.value)} className="w-full bg-red-50/30 border border-red-100 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 font-medium placeholder-red-300 text-sm" placeholder="📝 Nota (Ej: Paga mañana, olvidó plata)..." />
              </div>

              <div className="flex items-center gap-3 bg-yellow-50 hover:bg-yellow-100 p-4 rounded-2xl border border-yellow-200 cursor-pointer transition-colors" onClick={() => setEsIncentivo(!esIncentivo)}>
                 <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${esIncentivo ? 'bg-yellow-500 border-yellow-500' : 'bg-white border-yellow-300'}`}>
                   {esIncentivo && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                 </div>
                 <label className="text-sm font-bold text-yellow-700 cursor-pointer">🎁 Otorgar Cortesía</label>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={cargando || (!esNuevo && !usuarioSeleccionado)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl transition-all shadow-md text-lg">
                  {cargando ? "Registrando..." : "Guardar & Siguiente ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL INTELIGENTE: PAGO TOTAL / ABONO --- */}
      {deudorSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative">
            <button type="button" onClick={() => {setDeudorSeleccionado(null); setMontoAbono("");}} className="absolute top-6 right-6 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4"><span className="text-xl">💰</span></div>
            <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1">{deudorSeleccionado.nombre}</h3>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4">Deuda Total Activa</p>
            <p className="text-5xl font-black text-red-500 mb-6 tracking-tighter">${deudorSeleccionado.montoTotal.toLocaleString('es-CO')}</p>
            
            <form onSubmit={procesarAbonoTotal}>
              <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                <label className="block text-gray-500 font-bold mb-3 text-sm">¿Cuánto va a pagar ahora?</label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setMontoAbono(deudorSeleccionado.montoTotal)} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500 font-bold py-2 rounded-xl text-xs transition-colors shadow-sm">Pagar Total</button>
                  <button type="button" onClick={() => setMontoAbono("")} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-500 font-bold py-2 rounded-xl text-xs transition-colors shadow-sm">Otro monto</button>
                </div>
                <input type="number" min="1" max={deudorSeleccionado.montoTotal} required value={montoAbono} onChange={(e) => setMontoAbono(Number(e.target.value))} className="w-full bg-white border border-gray-200 p-3 rounded-xl text-gray-800 font-black focus:outline-none focus:ring-2 focus:ring-red-200 text-lg" placeholder="Ej: 15000" />
              </div>

              <div className="mb-6">
                <label className="block text-gray-500 font-bold mb-2 text-sm ml-1">Método</label>
                <select value={metodoPagoAbono} onChange={(e) => setMetodoPagoAbono(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 font-bold">
                  <option value="Efectivo">💵 Efectivo</option><option value="Nequi">📱 Nequi</option><option value="Bancolombia">🏦 Bancolombia</option><option value="Daviplata">🔴 Daviplata</option>
                </select>
              </div>
              
              <button type="submit" disabled={cargando || !montoAbono} className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-all shadow-md">
                {cargando ? "Procesando..." : (montoAbono === deudorSeleccionado.montoTotal ? "Saldar Deuda Completa" : "Registrar Abono Parcial")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL UNITARIO (Caja Diaria) --- */}
      {mostrarModalCobro && entrenamientoACobrar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">💰</span></div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{entrenamientoACobrar.usuarios_externos?.nombre}</h3>
            <p className="text-sm text-gray-400 font-medium mb-4">Monto de la entrada</p>
            <p className="text-5xl font-black text-green-500 mb-8 tracking-tighter">${entrenamientoACobrar.monto_generado.toLocaleString('es-CO')}</p>
            
            <div className="text-left mb-8">
              <label className="block text-gray-500 font-bold mb-2 text-sm ml-1">Método de pago</label>
              <select value={metodoPagoAbono} onChange={(e) => setMetodoPagoAbono(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-100 font-bold">
                <option value="Efectivo">💵 Efectivo</option><option value="Nequi">📱 Nequi</option><option value="Bancolombia">🏦 Bancolombia</option><option value="Daviplata">🔴 Daviplata</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setMostrarModalCobro(false)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors">Cancelar</button>
              <button onClick={procesarPagoUnitario} className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md">Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL INSCRIPCION --- */}
      {mostrarModalInscripcion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
            <button type="button" onClick={() => setMostrarModalInscripcion(false)} className="absolute top-6 right-6 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Crear Ficha</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium">Agregar a la base de datos sin cobrar.</p>
            <form onSubmit={inscribirUsuario} className="space-y-4">
              <input type="text" required value={nombreInsc} onChange={(e) => setNombreInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium" placeholder="Nombre completo" />
              <input type="text" value={telefonoInsc} onChange={(e) => setTelefonoInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium" placeholder="Número de contacto" />
              <select value={tipoInsc} onChange={(e) => setTipoInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 font-medium">
                <option value="Libre">Libre</option><option value="Profesor">Profesor Externo</option>
              </select>
              <button type="submit" disabled={cargando} className="w-full bg-blue-950 text-white font-bold py-4 rounded-2xl mt-4">Guardar Ficha</button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}