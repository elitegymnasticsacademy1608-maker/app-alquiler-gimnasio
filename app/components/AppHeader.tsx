import Image from "next/image";
import { IconoClose } from "./icons";

type AppHeaderProps = {
  rolActivo: string;
  vistaActiva: string;
  onVistaChange: (vista: string) => void;
  onCerrarSesion: () => void;
};

export function AppHeader({ rolActivo, vistaActiva, onVistaChange, onCerrarSesion }: AppHeaderProps) {
  const esAdmin = rolActivo === "admin";

  const navClass = (vista: string) =>
    `px-5 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap outline-none ${
      vistaActiva === vista ? "bg-white text-blue-950 shadow-sm" : "text-gray-500 hover:text-gray-800"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 flex-shrink-0">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-blue-950 leading-none">ELITE <span className="text-blue-600">SYSTEM</span></h1>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full mt-1 inline-block ${esAdmin ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>Sesión: {rolActivo}</span>
          </div>
        </div>
        <nav className="flex items-center gap-2 overflow-x-auto w-full md:w-auto hide-scrollbar">
          <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200">
            <button onClick={() => onVistaChange("caja")} className={navClass("caja")}>Caja Diaria</button>
            {esAdmin && (
              <>
                <button onClick={() => onVistaChange("finanzas")} className={navClass("finanzas")}>Finanzas</button>
                <button onClick={() => onVistaChange("historial")} className={navClass("historial")}>Historial</button>
                <button onClick={() => onVistaChange("basedatos")} className={navClass("basedatos")}>Directorio</button>
              </>
            )}
          </div>
          <button onClick={onCerrarSesion} className="ml-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold p-3 rounded-2xl transition-colors outline-none" title="Cerrar Sesión">
            <IconoClose />
          </button>
        </nav>
      </div>
    </header>
  );
}
