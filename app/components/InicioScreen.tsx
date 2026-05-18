import Image from "next/image";
import { IconoUser, IconoWallet } from "./icons";

type InicioScreenProps = {
  onEntrarAsistente: () => void;
  onEntrarAdmin: () => void;
};

export function InicioScreen({ onEntrarAsistente, onEntrarAdmin }: InicioScreenProps) {
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
          <button onClick={onEntrarAsistente} className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-lg py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
            <div className="text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300"><IconoUser /></div>
            <span className="text-xl font-bold text-gray-800">Recepción</span>
          </button>
          <button onClick={onEntrarAdmin} className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-lg py-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center">
            <div className="text-blue-950 mb-4 group-hover:scale-110 transition-transform duration-300"><IconoWallet /></div>
            <span className="text-xl font-bold text-gray-800">Administración</span>
          </button>
        </div>
      </div>
    </main>
  );
}
