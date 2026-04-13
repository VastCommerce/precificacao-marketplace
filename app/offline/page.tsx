export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-3xl font-bold text-white">
          FA
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Você está offline
        </h1>

        <p className="mt-3 text-slate-600">
          Sem internet no momento. Quando a conexão voltar, seu app volta a funcionar normalmente.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          Dica: instale o app na tela inicial para abrir mais rápido.
        </div>
      </div>
    </div>
  )
}