'use client'

import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Marketplace = 'shopee' | 'ml'
type TipoML = 'classico' | 'premium'
type CategoriaML =
  | 'moda'
  | 'eletronicos'
  | 'games'
  | 'joias'
  | 'saude'
  | 'livros'
  | 'casa'
  | 'construcao'
  | 'informatica'
  | 'eletrodomesticos'

function toNumber(v: string) {
  return Number(v.replace(',', '.')) || 0
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0)
}

// ================== SHOPEE ==================
function getShopeeFees(preco: number) {
  if (preco < 80) return { perc: 0.2, fixo: 4 }
  if (preco < 100) return { perc: 0.14, fixo: 16 }
  if (preco < 200) return { perc: 0.14, fixo: 20 }
  return { perc: 0.14, fixo: 26 }
}

// ================== MERCADO LIVRE ==================
function getComissaoML(tipo: TipoML, categoria: CategoriaML) {
  const tabela = {
    moda: { classico: 0.14, premium: 0.19 },
    eletronicos: { classico: 0.13, premium: 0.18 },
    games: { classico: 0.13, premium: 0.18 },
    joias: { classico: 0.125, premium: 0.175 },
    saude: { classico: 0.12, premium: 0.17 },
    livros: { classico: 0.12, premium: 0.17 },
    casa: { classico: 0.115, premium: 0.165 },
    construcao: { classico: 0.115, premium: 0.165 },
    informatica: { classico: 0.11, premium: 0.16 },
    eletrodomesticos: { classico: 0.11, premium: 0.16 },
  } as const

  return tabela[categoria][tipo]
}

function getFreteML(preco: number, peso: number) {
  const faixas = [
    [5.65, 6.55, 7.75, 18.52, 21.52, 24.67, 27.67, 31.42],
    [6.05, 6.75, 7.95, 20.77, 24.22, 27.67, 31.12, 35.47],
    [6.35, 7.95, 8.55, 23.62, 27.52, 31.57, 35.47, 39.37],
  ]

  let faixa = 0
  if (preco < 19) faixa = 0
  else if (preco < 49) faixa = 1
  else if (preco < 79) faixa = 2
  else if (preco < 99) faixa = 3
  else if (preco < 119) faixa = 4
  else if (preco < 149) faixa = 5
  else if (preco < 199) faixa = 6
  else faixa = 7

  if (peso <= 0.3) return faixas[0][faixa]
  if (peso <= 1) return faixas[1][faixa]
  return faixas[2][faixa]
}

// ================== APP ==================
export default function Page() {
  const [marketplace, setMarketplace] = useState<Marketplace>('shopee')
  const [tipoML, setTipoML] = useState<'classico' | 'premium'>('classico')
  const [categoria, setCategoria] = useState('eletronicos')
  const [peso, setPeso] = useState('0.3')

  const [custo, setCusto] = useState('0')
  const [embalagem, setEmbalagem] = useState('0')
  const [despesas, setDespesas] = useState('0')
  const [imposto, setImposto] = useState('0')
  const [margem, setMargem] = useState('20')

  const resultado = useMemo(() => {
    const base =
      toNumber(custo) +
      toNumber(embalagem) +
      toNumber(despesas)

    const impostoPerc = toNumber(imposto) / 100
    const margemPerc = toNumber(margem) / 100

    let preco = base * 1.5
    let comissao = 0
    let taxa = 0

    for (let i = 0; i < 50; i++) {
      if (marketplace === 'shopee') {
        const fee = getShopeeFees(preco)
        const den = 1 - fee.perc - impostoPerc - margemPerc
        preco = (base + fee.fixo) / den
      } else {
        const perc = getComissaoML(tipoML, categoria)
        const frete = getFreteML(preco, toNumber(peso))
        const den = 1 - perc - impostoPerc - margemPerc
        preco = (base + frete) / den
      }
    }

    if (marketplace === 'shopee') {
      const f = getShopeeFees(preco)
      comissao = preco * f.perc
      taxa = f.fixo
    } else {
      comissao = preco * getComissaoML(tipoML, categoria)
      taxa = getFreteML(preco, toNumber(peso))
    }

    const impostoValor = preco * impostoPerc
    const lucro = preco - base - comissao - taxa - impostoValor

    return { preco, lucro, taxa, comissao }
  }, [custo, embalagem, despesas, imposto, margem, marketplace, tipoML, categoria, peso])

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calculadora Marketplace</h1>
          <p className="text-gray-500">Shopee + Mercado Livre</p>
        </div>

        <div className="text-right">
          <p className="text-sm">Preço</p>
          <p className="text-xl font-bold">{formatBRL(resultado.preco)}</p>
        </div>
      </div>

      {/* MARKETPLACE */}
      <div className="flex gap-2">
        <Button onClick={() => setMarketplace('shopee')}>
          Shopee
        </Button>
        <Button onClick={() => setMarketplace('ml')}>
          Mercado Livre
        </Button>
      </div>

      {/* ML CONFIG */}
      {marketplace === 'ml' && (
        <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl">
          <div>
            <Label>Tipo</Label>
            <select onChange={(e) => setTipoML(e.target.value as any)}>
              <option value="classico">Clássico</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <Label>Categoria</Label>
            <select onChange={(e) => setCategoria(e.target.value)}>
              <option value="eletronicos">Eletrônicos</option>
              <option value="beleza">Beleza</option>
              <option value="veiculos">Veículos</option>
              <option value="moda">Moda</option>
            </select>
          </div>

          <div>
            <Label>Peso</Label>
            <Input value={peso} onChange={(e) => setPeso(e.target.value)} />
          </div>
        </div>
      )}

      {/* INPUTS */}
      <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl">
        <div><Label>Custo</Label><Input value={custo} onChange={e => setCusto(e.target.value)} /></div>
        <div><Label>Embalagem</Label><Input value={embalagem} onChange={e => setEmbalagem(e.target.value)} /></div>
        <div><Label>Despesas</Label><Input value={despesas} onChange={e => setDespesas(e.target.value)} /></div>
        <div><Label>Imposto (%)</Label><Input value={imposto} onChange={e => setImposto(e.target.value)} /></div>
        <div><Label>Margem (%)</Label><Input value={margem} onChange={e => setMargem(e.target.value)} /></div>
      </div>

      {/* RESULT */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl">
          <p>Lucro</p>
          <p className="font-bold text-green-600">{formatBRL(resultado.lucro)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl">
          <p>Comissão</p>
          <p>{formatBRL(resultado.comissao)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl">
          <p>Taxas/Frete</p>
          <p>{formatBRL(resultado.taxa)}</p>
        </div>
      </div>

    </div>
  )
}