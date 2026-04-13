'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ================= TYPES =================
type Marketplace = 'shopee' | 'ml'
type TipoML = 'classico' | 'premium'
type ModoCalculo = 'ideal' | 'alvo'

// ================= UTILS =================
const toNumber = (v: string) => Number(v.replace(',', '.')) || 0

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const formatPercent = (v: number) => `${v.toFixed(2).replace('.', ',')}%`

// ================= SHOPEE =================
function getShopeeFees(preco: number) {
  if (preco < 80) return { perc: 0.2, fixo: 4 }
  if (preco < 100) return { perc: 0.14, fixo: 16 }
  if (preco < 200) return { perc: 0.14, fixo: 20 }
  return { perc: 0.14, fixo: 26 }
}

// ================= ML =================
function getComissaoML(tipo: TipoML) {
  return tipo === 'premium' ? 0.165 : 0.115
}

function getPesoCubado(c: number, l: number, a: number) {
  return c > 0 && l > 0 && a > 0 ? (c * l * a) / 6000 : 0
}

function getFreteML(preco: number, peso: number) {
  const tabela = [
    { max: 3, valores: [5.65, 6.55, 7.75, 12.35, 14.35, 16.45, 18.35, 20.95] },
    { max: 5, valores: [6.55, 8.35, 9.75, 18.45, 21.55, 24.65, 27.75, 30.75] },
    { max: 10, valores: [6.95, 9.15, 10.55, 29.65, 34.55, 39.55, 44.45, 49.35] },
    { max: Infinity, valores: [7.45, 10.55, 11.95, 54.75, 63.85, 72.95, 82.05, 91.15] },
  ]

  const faixa =
    preco <= 18.99 ? 0 :
    preco <= 48.99 ? 1 :
    preco <= 78.99 ? 2 :
    preco <= 99.99 ? 3 :
    preco <= 119.99 ? 4 :
    preco <= 149.99 ? 5 :
    preco <= 199.99 ? 6 : 7

  const linha = tabela.find(r => peso <= r.max)!
  return linha.valores[faixa]
}

// ================= PAGE =================
export default function Page() {
  const [marketplace, setMarketplace] = useState<Marketplace>('ml')
  const [modo, setModo] = useState<ModoCalculo>('alvo')
  const [tipo, setTipo] = useState<TipoML>('premium')

  const [peso, setPeso] = useState('0.7')
  const [c, setC] = useState('32')
  const [l, setL] = useState('22')
  const [a, setA] = useState('22')

  const [custo, setCusto] = useState('46.2')
  const [emb, setEmb] = useState('3.09')
  const [imp, setImp] = useState('5')
  const [margem, setMargem] = useState('20')
  const [precoAlvo, setPrecoAlvo] = useState('119.9')

  const [prompt, setPrompt] = useState<any>(null)

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault()
      setPrompt(e)
    })
  }, [])

  const instalar = async () => {
    if (prompt) await prompt.prompt()
  }

  const r = useMemo(() => {
    const custoBase = toNumber(custo) + toNumber(emb)
    const imposto = toNumber(imp) / 100
    const margemPerc = toNumber(margem) / 100

    const pesoCubado = getPesoCubado(toNumber(c), toNumber(l), toNumber(a))
    const pesoFinal = Math.max(toNumber(peso), pesoCubado)

    let preco = modo === 'alvo' ? toNumber(precoAlvo) : custoBase * 1.5

    if (modo === 'ideal') {
      for (let i = 0; i < 50; i++) {
        const com = getComissaoML(tipo)
        const frete = getFreteML(preco, pesoFinal)
        preco = (custoBase + frete) / (1 - com - imposto - margemPerc)
      }
    }

    const comissao = preco * getComissaoML(tipo)
    const frete = getFreteML(preco, pesoFinal)
    const lucro = preco - custoBase - comissao - frete - preco * imposto

    return {
      preco,
      lucro,
      comissao,
      frete,
      margem: (lucro / preco) * 100,
    }
  }, [custo, emb, imp, margem, precoAlvo, peso, c, l, a, modo, tipo])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">

      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Calculadora Marketplace
          </h1>

          <Button
            onClick={instalar}
            className="rounded-xl px-3 py-2 text-xs md:text-sm bg-black text-white hover:scale-105 transition"
          >
            📲 Instalar
          </Button>
        </div>

        {/* BOTÕES */}
        <div className="flex gap-2 flex-wrap">

          <Button
            onClick={() => setMarketplace('shopee')}
            className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm rounded-xl transition-all active:scale-95 hover:scale-105 ${
              marketplace === 'shopee'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 border'
            }`}
          >
            <img src="/shopee.png" className="w-4 h-4" />
            Shopee
          </Button>

          <Button
            onClick={() => setMarketplace('ml')}
            className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm rounded-xl transition-all active:scale-95 hover:scale-105 ${
              marketplace === 'ml'
                ? 'bg-yellow-400 text-black shadow-lg'
                : 'bg-white dark:bg-slate-800 border'
            }`}
          >
            <img src="/mercadolivre.png" className="w-4 h-4" />
            ML
          </Button>

          <Button
            onClick={() => setModo('ideal')}
            className={`px-3 py-2 text-xs md:text-sm rounded-xl ${
              modo === 'ideal'
                ? 'bg-slate-900 text-white'
                : 'bg-white border'
            }`}
          >
            💰 Ideal
          </Button>

          <Button
            onClick={() => setModo('alvo')}
            className={`px-3 py-2 text-xs md:text-sm rounded-xl ${
              modo === 'alvo'
                ? 'bg-blue-600 text-white'
                : 'bg-white border'
            }`}
          >
            🎯 Alvo
          </Button>
        </div>

        {/* INPUTS */}
        <div className="grid md:grid-cols-3 gap-4">
          <Input value={precoAlvo} onChange={e => setPrecoAlvo(e.target.value)} placeholder="Preço" />
          <Input value={custo} onChange={e => setCusto(e.target.value)} placeholder="Custo" />
          <Input value={emb} onChange={e => setEmb(e.target.value)} placeholder="Embalagem" />
          <Input value={peso} onChange={e => setPeso(e.target.value)} placeholder="Peso" />
          <Input value={c} onChange={e => setC(e.target.value)} placeholder="Comprimento" />
          <Input value={l} onChange={e => setL(e.target.value)} placeholder="Largura" />
          <Input value={a} onChange={e => setA(e.target.value)} placeholder="Altura" />
        </div>

        {/* RESULTADOS */}
        <div className="grid md:grid-cols-4 gap-4">

          <div className="bg-slate-900 text-white p-5 rounded-2xl hover:scale-105 transition">
            <p>Preço</p>
            <p className="text-2xl font-bold">{formatBRL(r.preco)}</p>
          </div>

          <div className="bg-emerald-600 text-white p-5 rounded-2xl hover:scale-105 transition">
            <p>Lucro</p>
            <p className="text-2xl">{formatBRL(r.lucro)}</p>
          </div>

          <div className="bg-orange-500 text-white p-5 rounded-2xl hover:scale-105 transition">
            <p>Margem</p>
            <p className="text-2xl">{formatPercent(r.margem)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl hover:scale-105 transition">
            <p>Frete</p>
            <p>{formatBRL(r.frete)}</p>
          </div>

        </div>

      </div>
    </div>
  )
}