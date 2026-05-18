import { IconoWallet } from "./icons";

type LoginScreenProps = {
  clave: string;
  errorLogin: boolean;
  onClaveChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBack: () => void;
};

export function LoginScreen({ clave, errorLogin, onClaveChange, onSubmit, onBack }: LoginScreenProps) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-sm w-full text-center border border-gray-100 relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 font-medium transition-colors outline-none">← Atrás</button>
        <div className="flex justify-center mb-6 mt-4"><div className="bg-blue-50 text-blue-600 p-4 rounded-3xl"><IconoWallet /></div></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Seguro</h2>
        <p className="text-gray-400 text-sm mb-8">Ingresa tu PIN de administrador</p>
        <form onSubmit={onSubmit}>
          <input type="password" value={clave} onChange={(e) => onClaveChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-center text-3xl tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white mb-6 text-gray-800 transition-all outline-none" placeholder="••••" />
          {errorLogin && <p className="text-red-500 font-medium mb-6 text-sm bg-red-50 py-2 rounded-xl">PIN incorrecto</p>}
          <button type="submit" className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-2xl shadow-md transition-all outline-none">Verificar</button>
        </form>
      </div>
    </main>
  );
}
