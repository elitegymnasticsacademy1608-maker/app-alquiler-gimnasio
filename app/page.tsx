"use client";

import { useState, useEffect } from "react";
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

  const entrarComoAsistente = () => {
    setRolActivo('asistente');
    setVistaActiva('caja');
    setPantalla('app');
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
  };

  // --- ESTADOS DE LA APLICACIÓN ---
  const [listaEntrenamientos, setListaEntrenamientos] = useState<any[]>([]);
  const [usuariosDB, setUsuariosDB] = useState<any[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  
  const [finanzas, setFinanzas] = useState({ mensual: 0, semanal: 0, deudaTotal: 0 });
  const [listaDeudores, setListaDeudores] = useState<any[]>([]);
  const [verDetalleDeuda, setVerDetalleDeuda] = useState(false);
  
  const [resumenClientes, setResumenClientes] = useState<any[]>([]);
  const [verDetallePagos, setVerDetallePagos] = useState(false);
  const [visitasPorUsuario, setVisitasPorUsuario] = useState<Record<string, number>>({});

  // NUEVO ESTADO: Top Deudores y Detalles de Fechas
  const [topDeudores, setTopDeudores] = useState<any[]>([]);
  const [deudorFechas, setDeudorFechas] = useState<any>(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [esNuevo, setEsNuevo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(""); 
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState("Libre"); 
  const [cantidadAtletas, setCantidadAtletas] = useState(1); 
  
  const [esIncentivo, setEsIncentivo] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [mostrarModalInscripcion, setMostrarModalInscripcion] = useState(false);
  const [nombreInsc, setNombreInsc] = useState("");
  const [telefonoInsc, setTelefonoInsc] = useState("");
  const [tipoInsc, setTipoInsc] = useState("Libre");

  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [entrenamientoACobrar, setEntrenamientoACobrar] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState("Efectivo");

  const [filtroCaja, setFiltroCaja] = useState('pendientes');
  const [busquedaCaja, setBusquedaCaja] = useState("");
  const [busquedaDeuda, setBusquedaDeuda] = useState("");

  const [registrosGlobales, setRegistrosGlobales] = useState<any[]>([]);
  const [mesConsulta, setMesConsulta] = useState(new Date().getMonth());
  const [anioConsulta, setAnioConsulta] = useState(new Date().getFullYear());
  const mesesDelAno = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const tarifaPorAtletaProfesor = 10000; 

  const obtenerFechaHoy = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  };

  const formatearFechaConDia = (fechaStr: string) => {
    if (!fechaStr) return '';
    const d = new Date(fechaStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const procesarFinanzas = (registros: any[], mes: number, anio: number) => {
    let ingMes = 0; let ingSemana = 0; let deuda = 0;
    let deudores: any[] = [];
    const clientesAgrupados: Record<string, any> = {};
    const conteoVisitasFidelidad: Record<string, number> = {};
    
    // Agrupación para los Mayores Deudores
    const deudoresAgrupados: Record<string, any> = {};

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0,0,0,0);

    registros.forEach((ent: any) => {
      const fechaEnt = new Date(ent.fecha_asistencia + 'T00:00:00');
      const monto = Number(ent.monto_generado);
      const uid = ent.usuario_id;
      const tipoUsuarioBD = ent.usuarios_externos?.tipo_usuario?.trim() || '-';

      if (uid) {
        if (!clientesAgrupados[uid]) {
          clientesAgrupados[uid] = {
            nombre: ent.usuarios_externos?.nombre || 'Desconocido',
            telefono: ent.usuarios_externos?.telefono || '-',
            tipo: tipoUsuarioBD,
            totalPagado: 0,
            visitasTotales: 0
          };
        }
        clientesAgrupados[uid].visitasTotales += 1;

        if (tipoUsuarioBD === "Libre") {
           conteoVisitasFidelidad[uid] = (conteoVisitasFidelidad[uid] || 0) + 1;
        }
      }

      if (ent.estado_pago === 'Pendiente') {
        deuda += monto;
        deudores.push(ent);

        // Lógica de agrupación para "Deudores Mayores"
        if (uid) {
          if (!deudoresAgrupados[uid]) {
            deudoresAgrupados[uid] = {
              nombre: ent.usuarios_externos?.nombre || 'Desconocido',
              montoTotal: 0,
              fechas: []
            };
          }
          deudoresAgrupados[uid].montoTotal += monto;
          deudoresAgrupados[uid].fechas.push(ent.fecha_asistencia);
        }

      } else if (ent.estado_pago === 'Pagado') {
        if (fechaEnt.getMonth() === mes && fechaEnt.getFullYear() === anio) {
          ingMes += monto;
        }
        if (fechaEnt >= inicioSemana) {
          ingSemana += monto;
        }
        if (uid) clientesAgrupados[uid].totalPagado += monto;
      }
    });

    setFinanzas({ mensual: ingMes, semanal: ingSemana, deudaTotal: deuda });
    setListaDeudores(deudores);
    setVisitasPorUsuario(conteoVisitasFidelidad);
    
    const resumenArreglo = Object.values(clientesAgrupados).sort((a, b) => b.totalPagado - a.totalPagado);
    setResumenClientes(resumenArreglo);

    // Ordenar a los deudores mayores
    const topArreglo = Object.values(deudoresAgrupados).sort((a, b) => b.montoTotal - a.montoTotal);
    setTopDeudores(topArreglo);
  };

  const cargarDatos = async () => {
    setCargandoLista(true);
    try {
      const hoyStr = obtenerFechaHoy(); 

      const { data: hoyData } = await supabase
        .from('registro_entrenamientos')
        .select(`id, monto_generado, estado_pago, metodo_pago, cantidad_atletas, usuarios_externos (nombre, telefono, tipo_usuario)`)
        .eq('fecha_asistencia', hoyStr)
        .order('id', { ascending: false });
      setListaEntrenamientos(hoyData || []);

      const { data: clientes } = await supabase
        .from('usuarios_externos')
        .select('*')
        .order('nombre', { ascending: true });
      setUsuariosDB(clientes || []);

      const { data: todosLosRegistros } = await supabase
        .from('registro_entrenamientos')
        .select(`id, monto_generado, estado_pago, fecha_asistencia, usuario_id, usuarios_externos (nombre, telefono, tipo_usuario)`);

      if (todosLosRegistros) {
        setRegistrosGlobales(todosLosRegistros);
        procesarFinanzas(todosLosRegistros, mesConsulta, anioConsulta);
      }
    } catch (error) {
      console.error("Error al cargar:", (error as Error).message);
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => { 
    if (pantalla === 'app') cargarDatos(); 
  }, [pantalla]);

  useEffect(() => {
    if (registrosGlobales.length > 0) {
      procesarFinanzas(registrosGlobales, mesConsulta, anioConsulta);
    }
  }, [mesConsulta, anioConsulta, registrosGlobales]);

  const guardarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      let usuarioId = usuarioSeleccionado;
      let tipoUs = tipo;

      if (esNuevo) {
        const { data: u, error: eU } = await supabase.from("usuarios_externos").insert([{ nombre, telefono, tipo_usuario: tipo }]).select().single();
        if (eU) throw eU;
        usuarioId = u.id; tipoUs = u.tipo_usuario;
      } else {
        const cl = usuariosDB.find(u => u.id === usuarioId);
        if (cl) tipoUs = cl.tipo_usuario;
      }

      const visitasPrevias = visitasPorUsuario[usuarioId] || 0;
      const esCortesiaFidelidad = tipoUs === "Libre" && (visitasPrevias % 11 === 10); 
      const cant = tipoUs === "Libre" ? 1 : cantidadAtletas;
      
      let monto = 0;
      let estado = "Pendiente";
      let metodo = null;

      if (esIncentivo) {
        monto = 0;
        estado = "Pagado";
        metodo = "Incentivo Habilidad";
      } else if (esCortesiaFidelidad) {
        monto = 0;
        estado = "Pagado";
        metodo = "Cortesía Fidelidad";
      } else {
        monto = tipoUs === "Libre" ? 10000 : (tarifaPorAtletaProfesor * cantidadAtletas);
        estado = "Pendiente";
      }

      const hoyStr = obtenerFechaHoy();

      const { error: eR } = await supabase.from("registro_entrenamientos").insert([{ 
        usuario_id: usuarioId, cantidad_atletas: cant, monto_generado: monto, estado_pago: estado, metodo_pago: metodo, fecha_asistencia: hoyStr 
      }]);
      if (eR) throw eR;

      // ELIMINADAS LAS ALERTAS DE CONFIRMACIÓN PARA FLUIDEZ

      setNombre(""); setTelefono(""); setCantidadAtletas(1); setUsuarioSeleccionado(""); setEsIncentivo(false); setMostrarModal(false);
      
      if (estado === "Pagado") setFiltroCaja("pagados");
      else setFiltroCaja("pendientes");

      cargarDatos();
    } catch (error) { 
      alert("Error: " + (error as Error).message); 
    } finally { setCargando(false); }
  };

  const inscribirUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { error } = await supabase.from("usuarios_externos").insert([{ nombre: nombreInsc, telefono: telefonoInsc, tipo_usuario: tipoInsc }]);
      if (error) throw error;
      
      // ALERTA ELIMINADA PARA FLUIDEZ
      setNombreInsc(""); setTelefonoInsc(""); setMostrarModalInscripcion(false);
      cargarDatos();
    } catch (error) { 
      alert("Error: " + (error as Error).message); 
    } finally { setCargando(false); }
  };

  const procesarPago = async () => {
    try {
      const { error } = await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pagado', metodo_pago: metodoPago }).eq('id', entrenamientoACobrar.id);
      if (error) throw error;
      
      // ALERTA ELIMINADA PARA FLUIDEZ
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

  const eliminarIngreso = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas ELIMINAR por completo este registro?")) return;
    try {
      const { error } = await supabase.from('registro_entrenamientos').delete().eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch (error) { alert("Error al eliminar: " + (error as Error).message); }
  };

  const totalPersonasHoy = listaEntrenamientos.reduce((suma, item) => suma + Number(item.cantidad_atletas), 0);
  
  const entrenamientosFiltrados = listaEntrenamientos.filter(item => {
    const cumpleEstado = filtroCaja === 'pendientes' ? item.estado_pago === 'Pendiente' : item.estado_pago === 'Pagado';
    const nombre = (item.usuarios_externos?.nombre || "").toLowerCase();
    const cumpleBusqueda = nombre.includes(busquedaCaja.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  const deudasFiltradas = listaDeudores.filter(deuda => {
    const nombre = (deuda.usuarios_externos?.nombre || "").toLowerCase();
    return nombre.includes(busquedaDeuda.toLowerCase());
  });


  if (pantalla === 'inicio') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-3xl w-full text-center border border-gray-100 relative overflow-hidden">
          {/* Diseño más limpio tipo Apple */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-blue-900"></div>
          <div className="flex justify-center mb-8">
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 inline-block">
               <Image src="/logo.png" alt="Logo Gimnasio" width={110} height={110} className="object-contain" priority />
             </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-blue-950 mb-3">Control <span className="text-red-600">Externo</span></h1>
          <p className="text-gray-400 font-medium mb-12">Plataforma de gestión y accesos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={entrarComoAsistente} className="group bg-white border border-gray-200 hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📝</span>
              <span className="text-xl font-bold text-gray-800">Recepción</span>
            </button>
            <button onClick={() => setPantalla('login')} className="group bg-white border border-gray-200 hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
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
          <div className="flex justify-center mb-6 mt-4">
             <div className="bg-gray-50 p-3 rounded-2xl inline-block">
               <span className="text-4xl">🔐</span>
             </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Seguro</h2>
          <p className="text-gray-400 text-sm mb-8">Ingresa tu PIN de administración</p>
          <form onSubmit={iniciarSesionAdmin}>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-center text-3xl tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white mb-6 text-gray-800 transition-all" placeholder="••••" />
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
        <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center gap-4">
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
        <div className="max-w-6xl mx-auto p-4 md:p-6 mt-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Ingresos de Hoy</h2>
              <span className="text-gray-400 font-medium capitalize flex items-center gap-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white border border-gray-200 text-gray-600 px-5 py-3 rounded-2xl font-bold shadow-sm hidden md:flex items-center gap-3">
                Atletas Hoy <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-lg">{totalPersonasHoy}</span>
              </div>
              <button onClick={() => {setMostrarModal(true); setEsIncentivo(false);}} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Asistencia
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex bg-gray-200/50 p-1.5 rounded-2xl w-full md:w-auto">
               <button onClick={() => setFiltroCaja('pendientes')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${filtroCaja === 'pendientes' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 Falta cobrar
               </button>
               <button onClick={() => setFiltroCaja('pagados')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${filtroCaja === 'pagados' ? 'bg-white text-green-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 Ya pagaron
               </button>
            </div>
            
            <div className="relative w-full md:w-80">
               <span className="absolute left-4 top-3.5 text-gray-400">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               </span>
               <input 
                 type="text" 
                 placeholder="Buscar por nombre..." 
                 value={busquedaCaja}
                 onChange={(e) => setBusquedaCaja(e.target.value)}
                 className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none text-gray-800 transition-all bg-white"
               />
            </div>
          </div>

          {cargandoLista ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {entrenamientosFiltrados.map((item, i) => (
                <div key={i} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col relative transition-all hover:shadow-md">
                  <div className={`px-5 py-4 font-bold flex justify-between items-center border-b border-gray-50 ${item.estado_pago === 'Pendiente' ? 'bg-red-50/50' : 'bg-green-50/50'}`}>
                    <span className="truncate text-gray-800 text-lg">{item.usuarios_externos?.nombre || 'Desconocido'}</span>
                    <button onClick={() => eliminarIngreso(item.id)} className="text-gray-300 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50" title="Eliminar registro">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  <div className="p-5 flex-grow text-gray-600">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-lg inline-block text-gray-500">{item.usuarios_externos?.tipo_usuario}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${item.estado_pago === 'Pendiente' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {item.monto_generado === 0 ? (item.metodo_pago === 'Incentivo Habilidad' ? 'INCENTIVO' : 'CORTESÍA') : (item.estado_pago === 'Pendiente' ? 'DEUDA' : 'PAGADO')}
                      </span>
                    </div>
                    <p className="text-3xl font-black text-gray-800 mt-4">${item.monto_generado.toLocaleString('es-CO')}</p>
                    {item.estado_pago === 'Pagado' && item.monto_generado > 0 && <p className="text-sm text-gray-400 font-medium mt-2 flex items-center gap-1">✅ {item.metodo_pago}</p>}
                    {item.monto_generado === 0 && <p className="text-sm text-yellow-600 font-bold mt-2 flex items-center gap-1">🎁 {item.metodo_pago}</p>}
                  </div>
                  {item.estado_pago === 'Pendiente' ? (
                    <div className="p-4 pt-0">
                       <button onClick={() => { setEntrenamientoACobrar(item); setMostrarModalCobro(true); }} className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm">
                         Cobrar Ahora
                       </button>
                    </div>
                  ) : (
                    <div className="p-4 pt-0">
                       <button onClick={() => reversarPago(item.id)} className="w-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 font-bold py-3 rounded-xl transition-colors text-sm border border-gray-100">
                         Anular & Devolver a Deuda
                       </button>
                    </div>
                  )}
                </div>
              ))}
              {entrenamientosFiltrados.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                  <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  <p className="text-lg font-medium">
                    {busquedaCaja ? "Sin resultados" : (filtroCaja === 'pendientes' ? "Lista limpia, todo cobrado ✨" : "Aún no hay ingresos de dinero hoy")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {vistaActiva === 'finanzas' && rolActivo === 'admin' && (
        <div className="max-w-6xl mx-auto p-4 md:p-6 mt-2">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Análisis Financiero</h2>
              <p className="text-gray-400 font-medium mt-1">Control de ingresos y deudores</p>
            </div>
            
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 w-full md:w-auto">
              <select value={mesConsulta} onChange={e => setMesConsulta(Number(e.target.value))} className="bg-transparent border-none text-blue-600 font-bold outline-none cursor-pointer pr-2 pl-3 py-1 flex-1">
                {mesesDelAno.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={anioConsulta} onChange={e => setAnioConsulta(Number(e.target.value))} className="bg-transparent border-none text-gray-500 font-bold outline-none cursor-pointer pr-3 py-1 bg-gray-50 rounded-xl">
                {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-blue-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-gray-400 font-bold mb-2 text-sm uppercase tracking-wider relative z-10">Ingresos Semana</p>
              <p className="text-4xl font-black text-gray-800 relative z-10">${finanzas.semanal.toLocaleString('es-CO')}</p>
            </div>
            
            <div onClick={() => { setVerDetallePagos(!verDetallePagos); setVerDetalleDeuda(false); }} className={`p-6 rounded-[2rem] shadow-sm border cursor-pointer transition-all flex flex-col relative overflow-hidden group ${verDetallePagos ? 'bg-blue-950 border-blue-900 text-white shadow-md' : 'bg-white border-gray-100 text-gray-800 hover:border-blue-200'}`}>
              <div className="absolute top-6 right-6 opacity-20"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
              <p className={`font-bold mb-2 text-sm uppercase tracking-wider relative z-10 ${verDetallePagos ? 'text-blue-200' : 'text-gray-400'}`}>Total {mesesDelAno[mesConsulta]}</p>
              <p className="text-4xl font-black relative z-10 mb-2">${finanzas.mensual.toLocaleString('es-CO')}</p>
              <p className={`text-xs font-medium mt-auto flex items-center gap-1 ${verDetallePagos ? 'text-blue-300' : 'text-blue-500'}`}>Ver desglose completo ➔</p>
            </div>

            <div onClick={() => { setVerDetalleDeuda(!verDetalleDeuda); setVerDetallePagos(false); }} className={`p-6 rounded-[2rem] shadow-sm border cursor-pointer transition-all flex flex-col relative overflow-hidden group ${verDetalleDeuda ? 'bg-red-50 border-red-200 shadow-md' : 'bg-white border-gray-100 hover:border-red-200'}`}>
              <div className="absolute top-6 right-6 opacity-20 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
              <p className={`font-bold mb-2 text-sm uppercase tracking-wider relative z-10 ${verDetalleDeuda ? 'text-red-500' : 'text-gray-400'}`}>Deuda Total Activa</p>
              <p className={`text-4xl font-black relative z-10 mb-2 ${verDetalleDeuda ? 'text-red-600' : 'text-gray-800'}`}>${finanzas.deudaTotal.toLocaleString('es-CO')}</p>
              <p className="text-xs font-medium mt-auto text-red-500 flex items-center gap-1">Ver lista de morosos ➔</p>
            </div>
          </div>

          {/* NUEVO: TOP DEUDORES WIDGET (Solo se muestra si hay deudas) */}
          {topDeudores.length > 0 && !verDetalleDeuda && !verDetallePagos && (
             <div className="mb-10 animate-fade-in">
               <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span className="bg-red-100 text-red-500 p-1.5 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span>
                 Mayores Deudores
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 {topDeudores.slice(0, 4).map((d, i) => (
                   <div key={i} onClick={() => setDeudorFechas(d)} className="bg-white p-5 rounded-3xl border border-red-100 shadow-sm cursor-pointer hover:shadow-md hover:border-red-300 transition-all relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-full -z-0"></div>
                     <p className="font-bold text-gray-800 truncate relative z-10">{d.nombre}</p>
                     <p className="text-2xl font-black text-red-500 mt-2 relative z-10">${d.montoTotal.toLocaleString('es-CO')}</p>
                     <p className="text-xs font-medium text-red-400 mt-3 inline-block bg-red-50 px-2 py-1 rounded-md">Ver {d.fechas.length} días ➔</p>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {verDetalleDeuda && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 animate-fade-in mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-50 pb-4">
                 <h3 className="text-2xl font-bold text-gray-800">Detalle Completo de Deudas</h3>
                 <div className="relative w-full md:w-72">
                   <span className="absolute left-4 top-2.5 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                   <input 
                     type="text" 
                     placeholder="Buscar deudor..." 
                     value={busquedaDeuda}
                     onChange={(e) => setBusquedaDeuda(e.target.value)}
                     className="w-full pl-11 pr-4 py-2 bg-gray-50 rounded-xl border border-transparent focus:border-red-200 focus:bg-white focus:outline-none text-gray-800 transition-all text-sm"
                   />
                 </div>
              </div>

              {listaDeudores.length === 0 ? (
                 <div className="text-center py-10">
                   <span className="text-4xl mb-4 block">✨</span>
                   <p className="text-gray-400 font-medium">Nadie debe dinero en este momento.</p>
                 </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Fecha</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Nombre</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Monto</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {deudasFiltradas.map((deuda, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 text-sm font-medium text-gray-500 capitalize whitespace-nowrap">{formatearFechaConDia(deuda.fecha_asistencia)}</td>
                          <td className="p-4 font-bold text-gray-800">{deuda.usuarios_externos?.nombre}</td>
                          <td className="p-4 text-red-500 font-black">${deuda.monto_generado.toLocaleString('es-CO')}</td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <button onClick={() => { setEntrenamientoACobrar(deuda); setMostrarModalCobro(true); }} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">Cobrar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {deudasFiltradas.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium bg-gray-50/50 rounded-xl">No se encontró a nadie en la lista.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {verDetallePagos && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 animate-fade-in mb-8">
              <div className="border-b border-gray-50 pb-4 mb-6">
                 <h3 className="text-2xl font-bold text-gray-800">Pagos e Historial de Clientes</h3>
                 <p className="text-gray-400 text-sm mt-1">Acumulado de dinero y progreso para cortesías.</p>
              </div>
              
              {resumenClientes.length === 0 ? (
                 <div className="text-center py-10">
                   <p className="text-gray-400 font-medium">Aún no hay pagos registrados en este mes.</p>
                 </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Cliente</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-center">Visitas</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Fidelidad</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Total Aportado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {resumenClientes.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-gray-800">{c.nombre}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block">{c.tipo}</span>
                          </td>
                          <td className="p-4 text-center font-bold text-blue-600 text-lg">{c.visitasTotales}</td>
                          
                          <td className="p-4 w-48">
                            {c.tipo === "Libre" ? (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${(c.visitasTotales % 11) * 10}%` }}></div>
                                </div>
                                <span className="text-[11px] font-medium text-gray-400">{c.visitasTotales % 11}/10 para regalo</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-300 font-bold block mt-1 uppercase tracking-wider">No aplica</span>
                            )}
                          </td>

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
        <div className="max-w-6xl mx-auto p-4 md:p-6 mt-2">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <div>
               <h2 className="text-3xl font-black text-gray-800 tracking-tight">Directorio</h2>
               <p className="text-gray-400 font-medium mt-1">Base de datos de atletas y profesores</p>
            </div>
            <button onClick={() => setMostrarModalInscripcion(true)} className="bg-blue-950 hover:bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold shadow-sm transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Inscribir
            </button>
          </div>
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre Completo</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto / Nequi</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Clasificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosDB.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 font-bold text-gray-800">{u.nombre}</td>
                    <td className="p-5 text-gray-500 font-medium">{u.telefono || '-'}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase ${u.tipo_usuario === 'Libre' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {u.tipo_usuario}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PRINCIPAL: TOMA DE ASISTENCIA */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-gray-800 mb-6">Nuevo Ingreso</h3>
            
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
              <button onClick={() => setEsNuevo(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!esNuevo ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Registrado</button>
              <button onClick={() => setEsNuevo(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${esNuevo ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Usuario Nuevo</button>
            </div>
            
            <form onSubmit={guardarIngreso} className="space-y-4">
              {!esNuevo ? (
                <div className="relative">
                  <select required value={usuarioSeleccionado} onChange={(e) => setUsuarioSeleccionado(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none font-medium">
                    <option value="" className="text-gray-400">Seleccionar atleta o profesor...</option>
                    {usuariosDB.map((u) => <option key={u.id} value={u.id}>{u.nombre} ({u.tipo_usuario})</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium" placeholder="Nombre completo" />
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium" placeholder="Teléfono o Nequi" />
                  <div className="relative">
                    <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCantidadAtletas(1); }} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none font-medium">
                      <option value="Libre">Entrenamiento Libre ($10.000)</option>
                      <option value="Profesor">Profesor Externo</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              )}
              
              {(tipo === "Profesor" || usuariosDB.find(u => u.id === usuarioSeleccionado)?.tipo_usuario === "Profesor") && (
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 animate-fade-in">
                  <label className="block text-blue-900 font-bold mb-3 text-sm">¿Cuántos atletas trae a su cargo hoy?</label>
                  <input type="number" min="1" required value={cantidadAtletas} onChange={(e) => setCantidadAtletas(Number(e.target.value))} className="w-full bg-white border border-blue-200 p-4 rounded-xl text-gray-800 font-black focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              )}

              <div className="flex items-center gap-3 bg-yellow-50/50 hover:bg-yellow-50 p-4 rounded-2xl border border-yellow-100 cursor-pointer transition-colors" onClick={() => setEsIncentivo(!esIncentivo)}>
                 <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${esIncentivo ? 'bg-yellow-500 border-yellow-500' : 'bg-white border-yellow-300'}`}>
                   {esIncentivo && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                 </div>
                 <label className="text-sm font-bold text-yellow-700 cursor-pointer pointer-events-none select-none">🎁 Otorgar Cortesía (Habilidad Nueva)</label>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => {setMostrarModal(false); setEsIncentivo(false);}} className="flex-1 py-4 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md">{cargando ? "Registrando..." : "Guardar Ingreso"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSCRIBIR NUEVO USUARIO */}
      {mostrarModalInscripcion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-gray-800 mb-2">Crear Ficha</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium">Agrega a la base de datos sin generar cobro hoy.</p>
            
            <form onSubmit={inscribirUsuario} className="space-y-4">
              <input type="text" required value={nombreInsc} onChange={(e) => setNombreInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium" placeholder="Nombre completo" />
              <input type="text" value={telefonoInsc} onChange={(e) => setTelefonoInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium" placeholder="Número de contacto" />
              <div className="relative">
                <select value={tipoInsc} onChange={(e) => setTipoInsc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none font-medium">
                  <option value="Libre">Libre</option>
                  <option value="Profesor">Profesor Externo</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setMostrarModalInscripcion(false)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-[2] bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-2xl transition-all shadow-md">{cargando ? "Guardando..." : "Inscribir"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COBRAR SALIDA */}
      {mostrarModalCobro && entrenamientoACobrar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{entrenamientoACobrar.usuarios_externos?.nombre}</h3>
            <p className="text-sm text-gray-400 font-medium mb-4">Monto a cancelar</p>
            <p className="text-5xl font-black text-green-500 mb-8 tracking-tighter">${entrenamientoACobrar.monto_generado.toLocaleString('es-CO')}</p>
            
            <div className="text-left mb-8">
              <label className="block text-gray-500 font-bold mb-2 text-sm ml-1">Método de pago</label>
              <div className="relative">
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-100 appearance-none font-bold">
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Nequi">📱 Nequi</option>
                  <option value="Bancolombia">🏦 Bancolombia</option>
                  <option value="Daviplata">🔴 Daviplata</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setMostrarModalCobro(false)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors">Cancelar</button>
              <button onClick={procesarPago} className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md">Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO MODAL: DETALLE FECHAS MAYOR DEUDOR */}
      {deudorFechas && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-800 leading-tight">{deudorFechas.nombre}</h3>
                <p className="text-sm text-gray-400 font-medium mt-1">Historial de deudas sin saldar</p>
              </div>
              <button onClick={() => setDeudorFechas(null)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                ✕
              </button>
            </div>
            
            <div className="bg-red-50 p-5 rounded-3xl text-center mb-6">
              <p className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">Deuda Total</p>
              <p className="text-4xl font-black text-red-500">${deudorFechas.montoTotal.toLocaleString('es-CO')}</p>
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Fechas pendientes ({deudorFechas.fechas.length})</p>
            <ul className="space-y-2 mb-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
              {deudorFechas.fechas.map((f: string, i: number) => (
                <li key={i} className="bg-gray-50 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 border border-gray-100 capitalize flex items-center gap-3">
                  <span className="text-xl">📅</span> {formatearFechaConDia(f)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </main>
  );
}