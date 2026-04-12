export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 text-3xl font-bold text-white">
          FA
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Você está offline
        </h1>

        <p className="mt-3 text-slate-600">
          Sem internet no momento. Assim que a conexão voltar, seu app continuará funcionando normalmente.
        </p>

        <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-sm text-orange-800">
          Dica: instale o app na tela inicial do celular para abrir mais rápido.
        </div>
      </div>
    </div>
  )
}