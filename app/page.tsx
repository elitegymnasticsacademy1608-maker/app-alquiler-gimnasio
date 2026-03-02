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

  // ESTADOS DE FILTROS Y BÚSQUEDA
  const [filtroCaja, setFiltroCaja] = useState('pendientes');
  const [busquedaCaja, setBusquedaCaja] = useState("");
  const [busquedaDeuda, setBusquedaDeuda] = useState("");

  // NUEVOS ESTADOS: Filtros de Meses para Finanzas
  const [registrosGlobales, setRegistrosGlobales] = useState<any[]>([]);
  const [mesConsulta, setMesConsulta] = useState(new Date().getMonth());
  const [anioConsulta, setAnioConsulta] = useState(new Date().getFullYear());
  const mesesDelAno = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const tarifaPorAtletaProfesor = 10000; 

  const obtenerFechaHoy = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  };

  // NUEVO: Función para formatear fechas con el día de la semana
  const formatearFechaConDia = (fechaStr: string) => {
    if (!fechaStr) return '';
    const d = new Date(fechaStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  // NUEVO: Motor que procesa las finanzas basado en el mes seleccionado
  const procesarFinanzas = (registros: any[], mes: number, anio: number) => {
    let ingMes = 0; let ingSemana = 0; let deuda = 0;
    let deudores: any[] = [];
    const clientesAgrupados: Record<string, any> = {};
    const conteoVisitasFidelidad: Record<string, number> = {};

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
      } else if (ent.estado_pago === 'Pagado') {
        
        // Aquí filtramos el mes y el año según los selectores de pantalla
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

  // Recalcular finanzas si el administrador cambia de mes
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

      if (esIncentivo) alert("🎁 ¡Excelente! Entrada de CORTESÍA registrada por NUEVA HABILIDAD.");
      else if (esCortesiaFidelidad) alert("🎉 ¡FELICIDADES! Esta es la entrada #11 de este cliente. Se ha registrado como CORTESÍA FIDELIDAD ($0).");
      else alert("¡Ingreso registrado en la caja de hoy!");

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
      alert("¡Usuario guardado en la Base de Datos con éxito!");
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
      alert("¡Pago exitoso!");
      setMostrarModalCobro(false);
      cargarDatos(); 
    } catch (error) { alert("Error: " + (error as Error).message); }
  };

  const reversarPago = async (id: number) => {
    if (!window.confirm("¿Estás seguro que deseas anular este pago? Volverá a aparecer como DEUDA.")) return;
    try {
      const { error } = await supabase.from('registro_entrenamientos').update({ estado_pago: 'Pendiente', metodo_pago: null }).eq('id', id);
      if (error) throw error;
      alert("Pago anulado. El monto ha regresado a las deudas.");
      cargarDatos();
    } catch (error) { alert("Error al anular: " + (error as Error).message); }
  };

  const eliminarIngreso = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas ELIMINAR por completo este registro? (Esta acción no se puede deshacer)")) return;
    try {
      const { error } = await supabase.from('registro_entrenamientos').delete().eq('id', id);
      if (error) throw error;
      alert("Registro eliminado exitosamente.");
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
      <main className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-3xl w-full text-center border-t-8 border-red-600">
          <div className="flex justify-center mb-6">
             <div className="bg-white p-3 rounded-2xl shadow-md inline-block">
               <Image src="/logo.png" alt="Logo Gimnasio" width={120} height={120} className="object-contain" priority />
             </div>
          </div>
          <h1 className="text-4xl font-black tracking-widest text-blue-900 mb-2">CONTROL <span className="text-red-600">EXTERNO</span></h1>
          <p className="text-gray-500 font-bold mb-10">Selecciona el modo de ingreso</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={entrarComoAsistente} className="bg-gray-50 border-2 border-gray-200 hover:border-blue-900 hover:bg-blue-50 py-12 rounded-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center">
              <span className="text-6xl mb-4">📝</span><span className="text-2xl font-bold text-blue-900">Modo Recepción</span>
            </button>
            <button onClick={() => setPantalla('login')} className="bg-gray-50 border-2 border-gray-200 hover:border-red-600 hover:bg-red-50 py-12 rounded-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center">
              <span className="text-6xl mb-4">🔐</span><span className="text-2xl font-bold text-blue-900">Administración</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (pantalla === 'login') {
    return (
      <main className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-sm w-full text-center border-t-8 border-red-600 relative">
          <button onClick={() => setPantalla('inicio')} className="absolute top-4 left-4 text-gray-400 hover:text-blue-900 font-bold">← Volver</button>
          <div className="flex justify-center mb-4 mt-6">
             <div className="bg-white p-2 rounded-xl shadow-sm inline-block border border-gray-100">
               <Image src="/logo.png" alt="Logo Gimnasio" width={80} height={80} className="object-contain" />
             </div>
          </div>
          <h2 className="text-2xl font-black text-blue-900 mb-2">Acceso Admin</h2>
          <p className="text-gray-500 font-bold mb-8">Ingresa tu clave maestra</p>
          <form onSubmit={iniciarSesionAdmin}>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} className="w-full border-2 border-gray-200 p-4 rounded-xl text-center text-2xl tracking-widest focus:outline-none focus:border-blue-900 mb-4 text-black" placeholder="****" />
            {errorLogin && <p className="text-red-600 font-bold mb-4 text-sm">Clave incorrecta. Intenta de nuevo.</p>}
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform transform hover:scale-105">Entrar al Sistema</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-10">
      <header className="bg-blue-900 text-white p-5 shadow-lg border-b-4 border-red-600">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-md flex-shrink-0">
               <Image src="/logo.png" alt="Logo Gimnasio" width={50} height={50} className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest leading-none">CONTROL <span className="text-red-500">EXTERNO</span></h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border border-white/30 ${rolActivo === 'admin' ? 'bg-green-600' : 'bg-purple-600'} inline-block mt-1`}>Modo {rolActivo === 'admin' ? 'Admin' : 'Recepción'}</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <div className="flex bg-blue-800 rounded-lg p-1 shadow-inner">
              <button onClick={() => setVistaActiva('caja')} className={`px-4 py-2 font-bold text-sm rounded-md transition-all whitespace-nowrap ${vistaActiva === 'caja' ? 'bg-white text-blue-900 shadow' : 'hover:bg-blue-700'}`}>Caja Diaria</button>
              {rolActivo === 'admin' && (
                <>
                  <button onClick={() => setVistaActiva('finanzas')} className={`px-4 py-2 font-bold text-sm rounded-md transition-all whitespace-nowrap ${vistaActiva === 'finanzas' ? 'bg-white text-blue-900 shadow' : 'hover:bg-blue-700'}`}>Finanzas & Deudas</button>
                  <button onClick={() => setVistaActiva('basedatos')} className={`px-4 py-2 font-bold text-sm rounded-md transition-all whitespace-nowrap ${vistaActiva === 'basedatos' ? 'bg-white text-blue-900 shadow' : 'hover:bg-blue-700'}`}>Base de Datos</button>
                </>
              )}
            </div>
            <button onClick={cerrarSesion} className="ml-2 text-white hover:text-red-400 font-bold p-2 transition-colors" title="Cerrar Sesión">🚪 Salir</button>
          </nav>
        </div>
      </header>

      {vistaActiva === 'caja' && (
        <div className="max-w-6xl mx-auto p-6 mt-4">
          <div className="flex justify-between items-center mb-6 border-b-2 border-gray-200 pb-2">
            <div>
              <h2 className="text-3xl font-extrabold text-blue-900">Ingresos de Hoy</h2>
              {/* FECHA MODIFICADA PARA MOSTRAR EL DÍA DE LA SEMANA */}
              <span className="text-gray-500 font-bold capitalize">{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-bold shadow-sm hidden md:block">
                Total Personas: <span className="text-xl text-red-600">{totalPersonasHoy}</span>
              </div>
              <button onClick={() => {setMostrarModal(true); setEsIncentivo(false);}} className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg transform hover:scale-105 transition-all">
                + Toma de Asistencia
              </button>
            </div>
          </div>
          
          <div className="bg-blue-100 text-blue-900 px-4 py-3 rounded-lg font-bold shadow-sm mb-6 md:hidden text-center">
            Total Personas Hoy: <span className="text-2xl text-red-600">{totalPersonasHoy}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex bg-gray-200 p-1 rounded-xl w-full md:w-auto">
               <button onClick={() => setFiltroCaja('pendientes')} className={`flex-1 md:px-6 py-2 rounded-lg font-bold text-sm transition-all ${filtroCaja === 'pendientes' ? 'bg-white text-red-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                 Faltan por cobrar
               </button>
               <button onClick={() => setFiltroCaja('pagados')} className={`flex-1 md:px-6 py-2 rounded-lg font-bold text-sm transition-all ${filtroCaja === 'pagados' ? 'bg-white text-green-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                 Ya pagaron / Cortesías
               </button>
            </div>
            
            <div className="relative w-full md:w-72">
               <span className="absolute left-3 top-3 text-gray-400">🔍</span>
               <input 
                 type="text" 
                 placeholder="Buscar persona hoy..." 
                 value={busquedaCaja}
                 onChange={(e) => setBusquedaCaja(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-900 focus:outline-none text-black transition-colors"
               />
            </div>
          </div>

          {cargandoLista ? <p className="text-center font-bold text-gray-400 mt-10">Cargando...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {entrenamientosFiltrados.map((item, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col relative animate-fade-in">
                  <div className={`p-4 text-white font-bold flex justify-between items-center ${item.estado_pago === 'Pendiente' ? 'bg-red-600' : 'bg-green-600'}`}>
                    <span className="pr-2 truncate">{item.usuarios_externos?.nombre || 'Desconocido'}</span>
                    <div className="flex items-center gap-3">
                      <span>{item.monto_generado === 0 ? (item.metodo_pago === 'Incentivo Habilidad' ? 'INCENTIVO' : 'CORTESÍA') : (item.estado_pago === 'Pendiente' ? 'DEUDA' : 'OK')}</span>
                      <button onClick={() => eliminarIngreso(item.id)} className="text-white opacity-70 hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-full w-6 h-6 flex items-center justify-center text-xs" title="Eliminar este registro">❌</button>
                    </div>
                  </div>
                  <div className="p-5 flex-grow text-gray-700">
                    <p><span className="font-bold">Tipo:</span> {item.usuarios_externos?.tipo_usuario}</p>
                    <p className="text-2xl font-black text-blue-900 mt-2">${item.monto_generado.toLocaleString('es-CO')}</p>
                    {item.estado_pago === 'Pagado' && item.monto_generado > 0 && <p className="text-xs text-gray-400 font-bold mt-1">Pagado con {item.metodo_pago}</p>}
                    {item.monto_generado === 0 && <p className="text-xs text-green-600 font-bold mt-1">⭐ {item.metodo_pago}</p>}
                  </div>
                  {item.estado_pago === 'Pendiente' ? (
                    <button onClick={() => { setEntrenamientoACobrar(item); setMostrarModalCobro(true); }} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 transition-colors">Cobrar Salida</button>
                  ) : (
                    <button onClick={() => reversarPago(item.id)} className="w-full bg-gray-50 hover:bg-gray-200 text-gray-400 hover:text-red-600 font-bold py-3 transition-colors text-sm border-t border-gray-200">
                      ↩ Anular Pago (Volver a Deuda)
                    </button>
                  )}
                </div>
              ))}
              {entrenamientosFiltrados.length === 0 && (
                <div className="col-span-full text-center text-gray-400 py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                  <p className="text-xl font-bold mb-2">
                    {busquedaCaja ? "No se encontró a nadie con ese nombre" : (filtroCaja === 'pendientes' ? "¡Todos han pagado! La lista de pendientes está vacía." : "Aún no hay pagos registrados hoy.")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {vistaActiva === 'finanzas' && rolActivo === 'admin' && (
        <div className="max-w-6xl mx-auto p-6 mt-4">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b-2 border-gray-200 pb-2">
            <h2 className="text-3xl font-extrabold text-blue-900">Resumen Financiero</h2>
            {/* NUEVO: SELECTORES DE MES Y AÑO */}
            <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
              <select value={mesConsulta} onChange={e => setMesConsulta(Number(e.target.value))} className="bg-transparent border-none text-blue-900 font-bold outline-none cursor-pointer pr-2">
                {mesesDelAno.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={anioConsulta} onChange={e => setAnioConsulta(Number(e.target.value))} className="bg-transparent border-none text-gray-500 font-bold outline-none cursor-pointer">
                {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-md border-l-8 border-blue-500">
              <p className="text-gray-500 font-bold mb-1">Ingresos de esta Semana</p>
              <p className="text-4xl font-black text-blue-900">${finanzas.semanal.toLocaleString('es-CO')}</p>
            </div>
            
            <div onClick={() => { setVerDetallePagos(!verDetallePagos); setVerDetalleDeuda(false); }} className="bg-green-600 p-6 rounded-2xl shadow-xl cursor-pointer hover:bg-green-700 transition-colors text-white transform hover:scale-105">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold mb-1 opacity-90">Ingresos Totales ({mesesDelAno[mesConsulta]})</p>
                  <p className="text-4xl font-black">${finanzas.mensual.toLocaleString('es-CO')}</p>
                </div>
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-sm mt-3 opacity-80 flex justify-between">
                <span>Clic para ver lista de pagos</span><span>👇</span>
              </p>
            </div>

            <div onClick={() => { setVerDetalleDeuda(!verDetalleDeuda); setVerDetallePagos(false); }} className="bg-red-600 p-6 rounded-2xl shadow-xl cursor-pointer hover:bg-red-700 transition-colors text-white transform hover:scale-105">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold mb-1 opacity-90">Deuda Total Acumulada</p>
                  <p className="text-4xl font-black">${finanzas.deudaTotal.toLocaleString('es-CO')}</p>
                </div>
                <span className="text-3xl">👇</span>
              </div>
            </div>
          </div>

          {verDetalleDeuda && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-red-600 animate-fade-in mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h3 className="text-2xl font-bold text-red-600">Detalle de Deudores</h3>
                 <div className="relative w-full md:w-64">
                   <span className="absolute left-3 top-2 text-gray-400">🔍</span>
                   <input 
                     type="text" 
                     placeholder="Buscar deudor..." 
                     value={busquedaDeuda}
                     onChange={(e) => setBusquedaDeuda(e.target.value)}
                     className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:border-red-600 focus:outline-none text-black"
                   />
                 </div>
              </div>

              {listaDeudores.length === 0 ? <p className="text-gray-500 font-bold">Nadie debe dinero en este momento.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-100 text-gray-700"><th className="p-3 border-b">Día y Fecha</th><th className="p-3 border-b">Nombre</th><th className="p-3 border-b">Monto</th><th className="p-3 border-b">Acción</th></tr></thead>
                    <tbody>
                      {deudasFiltradas.map((deuda, i) => (
                        <tr key={i} className="hover:bg-red-50">
                          {/* FECHA MODIFICADA PARA MOSTRAR EL DÍA DE LA SEMANA */}
                          <td className="p-3 border-b text-sm font-bold text-gray-500 capitalize">{formatearFechaConDia(deuda.fecha_asistencia)}</td>
                          <td className="p-3 border-b font-bold">{deuda.usuarios_externos?.nombre}</td>
                          <td className="p-3 border-b text-red-600 font-black">${deuda.monto_generado.toLocaleString('es-CO')}</td>
                          <td className="p-3 border-b">
                            <div className="flex space-x-2">
                              <button onClick={() => { setEntrenamientoACobrar(deuda); setMostrarModalCobro(true); }} className="bg-blue-900 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-800 transition-colors">Saldar</button>
                              <button onClick={() => eliminarIngreso(deuda.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm font-bold hover:bg-red-200" title="Eliminar registro">❌</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {deudasFiltradas.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">No se encontró a nadie con ese nombre en la lista de deudas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {verDetallePagos && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-green-600 animate-fade-in mb-8">
              <h3 className="text-2xl font-bold text-green-700 mb-2">Ranking de Clientes (Pagos e Historial)</h3>
              <p className="text-gray-500 mb-4 text-sm">Suma total de dinero aportado por persona y progreso para cortesía.</p>
              {resumenClientes.length === 0 ? <p className="text-gray-500 font-bold">Aún no hay pagos registrados.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-3 border-b">Nombre del Cliente</th>
                        <th className="p-3 border-b">Tipo</th>
                        <th className="p-3 border-b text-center">Asistencias Totales</th>
                        <th className="p-3 border-b">Fidelidad (Progreso)</th>
                        <th className="p-3 border-b text-right">Total Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumenClientes.map((c, i) => (
                        <tr key={i} className="hover:bg-green-50 transition-colors">
                          <td className="p-3 border-b font-bold text-gray-800">{c.nombre}</td>
                          <td className="p-3 border-b text-sm text-gray-600">{c.tipo}</td>
                          <td className="p-3 border-b text-center font-bold text-blue-900">{c.visitasTotales}</td>
                          
                          <td className="p-3 border-b text-sm">
                            {c.tipo === "Libre" ? (
                              <>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(c.visitasTotales % 11) * 10}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-500 mt-1 block">{c.visitasTotales % 11}/10 para cortesía</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold block mt-1">No aplica para profesores</span>
                            )}
                          </td>

                          <td className="p-3 border-b text-right text-green-700 font-black">${c.totalPagado.toLocaleString('es-CO')}</td>
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
        <div className="max-w-6xl mx-auto p-6 mt-4">
          <div className="flex justify-between items-center mb-6 border-b-2 border-gray-200 pb-2">
            <h2 className="text-3xl font-extrabold text-blue-900">Base de Datos de Usuarios</h2>
            <button onClick={() => setMostrarModalInscripcion(true)} className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-colors">
              + Inscribir Cliente
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-blue-900 text-white"><tr><th className="p-4">Nombre Completo</th><th className="p-4">Teléfono / Nequi</th><th className="p-4">Tipo de Usuario</th></tr></thead>
              <tbody>
                {usuariosDB.map((u, i) => (
                  <tr key={i} className="border-b hover:bg-blue-50"><td className="p-4 font-bold text-gray-800">{u.nombre}</td><td className="p-4 text-gray-600">{u.telefono || '-'}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${u.tipo_usuario === 'Libre' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{u.tipo_usuario}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-8 border-red-600">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Toma de Asistencia (Caja Diaria)</h3>
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button onClick={() => setEsNuevo(false)} className={`flex-1 py-2 text-sm font-bold rounded-md ${!esNuevo ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500'}`}>Cliente Frecuente</button>
              <button onClick={() => setEsNuevo(true)} className={`flex-1 py-2 text-sm font-bold rounded-md ${esNuevo ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500'}`}>+ Agregar Nuevo</button>
            </div>
            <form onSubmit={guardarIngreso} className="space-y-4">
              {!esNuevo ? (
                <select required value={usuarioSeleccionado} onChange={(e) => setUsuarioSeleccionado(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg text-black">
                  <option value="">-- Buscar en la lista --</option>
                  {usuariosDB.map((u) => <option key={u.id} value={u.id}>{u.nombre} ({u.tipo_usuario})</option>)}
                </select>
              ) : (
                <>
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg text-black" placeholder="Nombre completo" />
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg text-black" placeholder="Teléfono" />
                  <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCantidadAtletas(1); }} className="w-full border-2 border-gray-200 p-3 rounded-lg text-black">
                    <option value="Libre">Entrenamiento Libre ($10.000)</option>
                    <option value="Profesor">Profesor Externo</option>
                  </select>
                </>
              )}
              
              {(tipo === "Profesor" || usuariosDB.find(u => u.id === usuarioSeleccionado)?.tipo_usuario === "Profesor") && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <label className="block text-blue-900 font-bold mb-2">¿Cuántos atletas trae hoy?</label>
                  <input type="number" min="1" required value={cantidadAtletas} onChange={(e) => setCantidadAtletas(Number(e.target.value))} className="w-full border-2 border-blue-200 p-3 rounded-lg text-black" />
                </div>
              )}

              <div className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 p-3 rounded-lg border border-yellow-200 cursor-pointer transition-colors" onClick={() => setEsIncentivo(!esIncentivo)}>
                 <input type="checkbox" id="incentivo" checked={esIncentivo} onChange={(e) => setEsIncentivo(e.target.checked)} className="w-5 h-5 accent-yellow-600 cursor-pointer pointer-events-none" />
                 <label className="text-sm font-bold text-yellow-800 cursor-pointer pointer-events-none">🎁 Dar cortesía hoy (Habilidad Nueva)</label>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => {setMostrarModal(false); setEsIncentivo(false);}} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={cargando} className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg">{cargando ? "Guardando..." : "Registrar Entrada"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalInscripcion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-8 border-blue-900">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Inscribir Nuevo Cliente</h3>
            <p className="text-gray-500 text-sm mb-4">Se guardará en la base de datos sin generar cobro en la caja de hoy.</p>
            <form onSubmit={inscribirUsuario} className="space-y-4">
              <input type="text" required value={nombreInsc} onChange={(e) => setNombreInsc(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg text-black" placeholder="Nombre completo" />
              <input type="text" value={telefonoInsc} onChange={(e) => setTelefonoInsc(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg text-black" placeholder="Teléfono / Nequi" />
              <select value={tipoInsc} onChange={(e) => setTipoInsc(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg text-black">
                <option value="Libre">Libre</option>
                <option value="Profesor">Profesor Externo</option>
              </select>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setMostrarModalInscripcion(false)} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={cargando} className="bg-blue-900 text-white font-bold px-4 py-2 rounded-lg">{cargando ? "Guardando..." : "Inscribir"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalCobro && entrenamientoACobrar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border-t-8 border-green-600">
            <h3 className="text-xl font-bold mb-2">Cobrando a {entrenamientoACobrar.usuarios_externos?.nombre}</h3>
            <p className="text-3xl font-black text-green-600 mb-4">${entrenamientoACobrar.monto_generado.toLocaleString('es-CO')}</p>
            <label className="block text-gray-700 font-bold mb-2">¿Cómo pagó?</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg mb-6 text-black">
              <option value="Efectivo">Efectivo</option>
              <option value="Nequi">Nequi</option>
              <option value="Bancolombia">Bancolombia</option>
              <option value="Daviplata">Daviplata</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setMostrarModalCobro(false)} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={procesarPago} className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg">Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}