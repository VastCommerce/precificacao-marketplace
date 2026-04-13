'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Marketplace = 'shopee' | 'ml'
type TipoML = 'classico' | 'premium'
type ModoCalculo = 'ideal' | 'alvo'

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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function toNumber(v: string) {
  return Number(v.replace(',', '.')) || 0
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0)
}

function formatPercent(v: number) {
  return `${v.toFixed(2).replace('.', ',')}%`
}

function getCategoriaLabel(categoria: CategoriaML) {
  switch (categoria) {
    case 'moda':
      return 'Calçados, Roupas e Bolsas'
    case 'eletronicos':
      return 'Eletrônicos, Áudio e Vídeo'
    case 'games':
      return 'Games'
    case 'joias':
      return 'Joias e Relógios'
    case 'saude':
      return 'Saúde, Pet Shop, Beleza'
    case 'livros':
      return 'Livros, Revistas e Comics'
    case 'casa':
      return 'Casa, Móveis e Decoração'
    case 'construcao':
      return 'Construção e Ferramentas'
    case 'informatica':
      return 'Informática e Celulares'
    case 'eletrodomesticos':
      return 'Eletrodomésticos'
  }
}

function getShopeeFees(preco: number) {
  if (preco < 80) return { perc: 0.2, fixo: 4, faixa: 'Abaixo de R$ 80,00' }
  if (preco < 100) return { perc: 0.14, fixo: 16, faixa: 'De R$ 80,00 a R$ 99,99' }
  if (preco < 200) return { perc: 0.14, fixo: 20, faixa: 'De R$ 100,00 a R$ 199,99' }
  return { perc: 0.14, fixo: 26, faixa: 'A partir de R$ 200,00' }
}

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

function getPesoCubadoKg(comprimentoCm: number, larguraCm: number, alturaCm: number) {
  if (comprimentoCm <= 0 || larguraCm <= 0 || alturaCm <= 0) return 0
  return (comprimentoCm * larguraCm * alturaCm) / 6000
}

function getPesoConsideradoKg(
  pesoRealKg: number,
  comprimentoCm: number,
  larguraCm: number,
  alturaCm: number
) {
  const pesoCubadoKg = getPesoCubadoKg(comprimentoCm, larguraCm, alturaCm)
  return Math.max(pesoRealKg, pesoCubadoKg)
}

function getMlPriceBandIndex(preco: number) {
  if (preco <= 18.99) return 0
  if (preco <= 48.99) return 1
  if (preco <= 78.99) return 2
  if (preco <= 99.99) return 3
  if (preco <= 119.99) return 4
  if (preco <= 149.99) return 5
  if (preco <= 199.99) return 6
  return 7
}

function getMlShippingRow(pesoKg: number) {
  const rows = [
    { max: 0.3, values: [5.65, 6.55, 7.75, 12.35, 14.35, 16.45, 18.45, 20.95] },
    { max: 0.5, values: [5.95, 6.65, 7.85, 13.25, 15.45, 17.65, 19.85, 22.55] },
    { max: 1, values: [6.05, 6.75, 7.95, 13.85, 16.15, 18.45, 20.75, 23.65] },
    { max: 1.5, values: [6.15, 6.85, 8.05, 14.15, 16.45, 18.85, 21.15, 24.65] },
    { max: 2, values: [6.25, 6.95, 8.15, 14.45, 16.85, 19.25, 21.65, 24.65] },
    { max: 3, values: [6.35, 7.95, 8.55, 15.75, 18.35, 21.05, 23.65, 26.25] },
    { max: 4, values: [6.45, 8.15, 8.95, 17.05, 19.85, 22.65, 25.55, 28.35] },
    { max: 5, values: [6.55, 8.35, 9.75, 18.45, 21.55, 24.65, 27.75, 30.75] },
    { max: 6, values: [6.65, 8.55, 9.95, 25.45, 28.55, 32.65, 35.75, 39.75] },
    { max: 7, values: [6.75, 8.75, 10.15, 27.05, 31.05, 36.05, 40.05, 44.05] },
    { max: 8, values: [6.85, 8.95, 10.35, 28.85, 33.65, 38.45, 43.25, 48.05] },
    { max: 9, values: [6.95, 9.15, 10.55, 29.65, 34.55, 39.55, 44.45, 49.35] },
    { max: 11, values: [7.05, 9.55, 10.95, 41.25, 48.05, 54.95, 61.75, 68.65] },
    { max: 13, values: [7.15, 9.95, 11.35, 42.15, 49.25, 56.25, 63.25, 70.25] },
    { max: 15, values: [7.25, 10.15, 11.55, 45.05, 52.45, 59.95, 67.45, 74.95] },
    { max: 17, values: [7.35, 10.35, 11.75, 48.55, 56.05, 63.55, 70.75, 78.65] },
    { max: 20, values: [7.45, 10.55, 11.95, 54.75, 63.85, 72.95, 82.05, 91.15] },
    { max: 25, values: [7.65, 10.95, 12.15, 64.05, 75.05, 84.75, 95.35, 105.95] },
    { max: 30, values: [7.75, 11.15, 12.35, 65.95, 75.45, 85.55, 96.25, 106.95] },
    { max: 40, values: [7.85, 11.35, 12.55, 67.75, 78.95, 88.95, 99.15, 107.05] },
    { max: 50, values: [7.95, 11.55, 12.75, 70.25, 81.05, 92.05, 102.55, 110.75] },
    { max: 60, values: [8.05, 11.75, 12.95, 74.95, 86.45, 98.15, 109.35, 118.15] },
    { max: 70, values: [8.15, 11.95, 13.15, 80.25, 92.95, 105.05, 117.15, 126.55] },
    { max: 80, values: [8.25, 12.15, 13.35, 83.95, 97.05, 109.85, 122.45, 132.25] },
    { max: 90, values: [8.35, 12.35, 13.55, 93.25, 107.45, 122.05, 136.05, 146.95] },
    { max: 100, values: [8.45, 12.55, 13.75, 106.55, 123.95, 139.55, 155.55, 167.95] },
    { max: 125, values: [8.55, 12.75, 13.95, 119.25, 138.05, 156.05, 173.95, 187.95] },
    { max: 150, values: [8.65, 12.75, 14.15, 126.55, 146.15, 165.65, 184.65, 199.45] },
    { max: Infinity, values: [8.75, 12.75, 14.35, 249.22, 288.67, 326.32, 363.82, 392.92] },
  ]

  return rows.find((row) => pesoKg <= row.max) ?? rows[rows.length - 1]
}

function getMlShippingCost(preco: number, pesoKg: number) {
  const row = getMlShippingRow(pesoKg)
  const band = getMlPriceBandIndex(preco)
  return row.values[band]
}

function SaaSCard({
  title,
  children,
  className = '',
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function Page() {
  const [marketplace, setMarketplace] = useState<Marketplace>('shopee')
  const [modoCalculo, setModoCalculo] = useState<ModoCalculo>('ideal')
  const [tipoML, setTipoML] = useState<TipoML>('classico')
  const [categoriaML, setCategoriaML] = useState<CategoriaML>('eletronicos')

  const [pesoReal, setPesoReal] = useState('0')
  const [comprimento, setComprimento] = useState('0')
  const [largura, setLargura] = useState('0')
  const [altura, setAltura] = useState('0')

  const [custo, setCusto] = useState('0')
  const [embalagem, setEmbalagem] = useState('0')
  const [despesas, setDespesas] = useState('0')
  const [imposto, setImposto] = useState('0')
  const [margem, setMargem] = useState('20')
  const [precoAlvo, setPrecoAlvo] = useState('0')

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [appInstalado, setAppInstalado] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => {
      setAppInstalado(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const instalarApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const resultado = useMemo(() => {
    const custoNum = toNumber(custo)
    const embalagemNum = toNumber(embalagem)
    const despesasNum = toNumber(despesas)
    const impostoPerc = toNumber(imposto) / 100
    const margemPerc = toNumber(margem) / 100

    const pesoRealKg = toNumber(pesoReal)
    const comprimentoCm = toNumber(comprimento)
    const larguraCm = toNumber(largura)
    const alturaCm = toNumber(altura)

    const pesoCubadoKg = getPesoCubadoKg(comprimentoCm, larguraCm, alturaCm)
    const pesoConsideradoKg = getPesoConsideradoKg(
      pesoRealKg,
      comprimentoCm,
      larguraCm,
      alturaCm
    )

    const custoBase = custoNum + embalagemNum + despesasNum

    const tudoZero =
      custoBase === 0 &&
      impostoPerc === 0 &&
      pesoRealKg === 0 &&
      pesoCubadoKg === 0 &&
      (modoCalculo === 'alvo' ? toNumber(precoAlvo) === 0 : toNumber(margem) === 0)

    if (tudoZero) {
      return {
        preco: 0,
        custoBase: 0,
        comissao: 0,
        taxa: 0,
        impostoValor: 0,
        lucro: 0,
        margemReal: 0,
        percentualComissao: 0,
        descricaoTaxa: '-',
        pesoCubadoKg: 0,
        pesoConsideradoKg: 0,
      }
    }

    let preco = modoCalculo === 'alvo' ? toNumber(precoAlvo) : custoBase * 1.5

    if (modoCalculo === 'ideal') {
      for (let i = 0; i < 80; i++) {
        if (marketplace === 'shopee') {
          const fee = getShopeeFees(preco)
          const den = 1 - fee.perc - impostoPerc - margemPerc
          if (den <= 0) break
          preco = (custoBase + fee.fixo) / den
        } else {
          const perc = getComissaoML(tipoML, categoriaML)
          const frete = getMlShippingCost(preco, pesoConsideradoKg)
          const den = 1 - perc - impostoPerc - margemPerc
          if (den <= 0) break
          preco = (custoBase + frete) / den
        }
      }
    }

    let comissao = 0
    let taxa = 0
    let percentualComissao = 0
    let descricaoTaxa = '-'

    if (marketplace === 'shopee') {
      const fee = getShopeeFees(preco)
      comissao = preco * fee.perc
      taxa = fee.fixo
      percentualComissao = fee.perc * 100
      descricaoTaxa = fee.faixa
    } else {
      const perc = getComissaoML(tipoML, categoriaML)
      const frete = getMlShippingCost(preco, pesoConsideradoKg)
      comissao = preco * perc
      taxa = frete
      percentualComissao = perc * 100
      descricaoTaxa = `${tipoML === 'classico' ? 'Clássico' : 'Premium'} • ${getCategoriaLabel(categoriaML)}`
    }

    const impostoValor = preco * impostoPerc
    const lucro = preco - custoBase - comissao - taxa - impostoValor
    const margemReal = preco > 0 ? (lucro / preco) * 100 : 0

    return {
      preco,
      custoBase,
      comissao,
      taxa,
      impostoValor,
      lucro,
      margemReal,
      percentualComissao,
      descricaoTaxa,
      pesoCubadoKg,
      pesoConsideradoKg,
    }
  }, [
    custo,
    embalagem,
    despesas,
    imposto,
    margem,
    precoAlvo,
    marketplace,
    modoCalculo,
    tipoML,
    categoriaML,
    pesoReal,
    comprimento,
    largura,
    altura,
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-[1px] shadow-xl">
          <div className="rounded-[28px] bg-white px-6 py-8 md:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  SaaS • Precificação • Shopee + Mercado Livre
                </span>

                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                    Calculadora Marketplace
                  </h1>
                  <p className="mt-2 text-sm text-slate-500 md:text-base">
                    Simule preço ideal ou preço alvo com comissão, imposto, peso cubado e frete automático.
                  </p>
                </div>

                {!appInstalado && installPrompt && (
                  <Button
                    type="button"
                    onClick={instalarApp}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800"
                  >
                    Instalar aplicativo
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[480px]">
                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {modoCalculo === 'ideal' ? 'Preço ideal' : 'Preço alvo'}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{formatBRL(resultado.preco)}</p>
                </div>

                <div className="rounded-2xl bg-emerald-600 p-4 text-white">
                  <p className="text-xs uppercase tracking-wide text-emerald-100">Lucro</p>
                  <p className="mt-2 text-2xl font-bold">{formatBRL(resultado.lucro)}</p>
                </div>

                <div className="rounded-2xl bg-orange-500 p-4 text-white">
                  <p className="text-xs uppercase tracking-wide text-orange-100">Margem real</p>
                  <p className="mt-2 text-2xl font-bold">{formatPercent(resultado.margemReal)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SaaSCard title="Configurações gerais">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <Label>Marketplace</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={marketplace === 'shopee' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setMarketplace('shopee')}
                >
                  Shopee
                </Button>
                <Button
                  type="button"
                  variant={marketplace === 'ml' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setMarketplace('ml')}
                >
                  Mercado Livre
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Modo de cálculo</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={modoCalculo === 'ideal' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setModoCalculo('ideal')}
                >
                  Preço Ideal
                </Button>
                <Button
                  type="button"
                  variant={modoCalculo === 'alvo' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setModoCalculo('alvo')}
                >
                  Preço Alvo
                </Button>
              </div>
            </div>
          </div>
        </SaaSCard>

        {marketplace === 'ml' && (
          <SaaSCard title="Configuração Mercado Livre">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <Label>Tipo de anúncio</Label>
                <select
                  value={tipoML}
                  onChange={(e) => setTipoML(e.target.value as TipoML)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
                >
                  <option value="classico">Clássico</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <Label>Categoria</Label>
                <select
                  value={categoriaML}
                  onChange={(e) => setCategoriaML(e.target.value as CategoriaML)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
                >
                  <option value="moda">Calçados, Roupas e Bolsas</option>
                  <option value="eletronicos">Eletrônicos, Áudio e Vídeo</option>
                  <option value="games">Games</option>
                  <option value="joias">Joias e Relógios</option>
                  <option value="saude">Saúde, Pet Shop, Beleza</option>
                  <option value="livros">Livros, Revistas e Comics</option>
                  <option value="casa">Casa, Móveis e Decoração</option>
                  <option value="construcao">Construção e Ferramentas</option>
                  <option value="informatica">Informática e Celulares</option>
                  <option value="eletrodomesticos">Eletrodomésticos</option>
                </select>
              </div>

              <div>
                <Label>Peso real (kg)</Label>
                <Input
                  className="mt-2 h-11 rounded-xl"
                  value={pesoReal}
                  onChange={(e) => setPesoReal(e.target.value)}
                  placeholder="Ex.: 0,700"
                />
              </div>

              <div>
                <Label>Comprimento (cm)</Label>
                <Input
                  className="mt-2 h-11 rounded-xl"
                  value={comprimento}
                  onChange={(e) => setComprimento(e.target.value)}
                />
              </div>

              <div>
                <Label>Largura (cm)</Label>
                <Input
                  className="mt-2 h-11 rounded-xl"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                />
              </div>

              <div>
                <Label>Altura (cm)</Label>
                <Input
                  className="mt-2 h-11 rounded-xl"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                />
              </div>
            </div>
          </SaaSCard>
        )}

        <SaaSCard title="Custos e parâmetros">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modoCalculo === 'alvo' && (
              <div>
                <Label>Preço alvo</Label>
                <Input
                  className="mt-2 h-11 rounded-xl"
                  value={precoAlvo}
                  onChange={(e) => setPrecoAlvo(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Custo do produto</Label>
              <Input
                className="mt-2 h-11 rounded-xl"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
              />
            </div>

            <div>
              <Label>Embalagem</Label>
              <Input
                className="mt-2 h-11 rounded-xl"
                value={embalagem}
                onChange={(e) => setEmbalagem(e.target.value)}
              />
            </div>

            <div>
              <Label>Despesas</Label>
              <Input
                className="mt-2 h-11 rounded-xl"
                value={despesas}
                onChange={(e) => setDespesas(e.target.value)}
              />
            </div>

            <div>
              <Label>Imposto (%)</Label>
              <Input
                className="mt-2 h-11 rounded-xl"
                value={imposto}
                onChange={(e) => setImposto(e.target.value)}
              />
            </div>

            {modoCalculo === 'ideal' && (
              <div>
                <Label>Margem desejada (%)</Label>
                <Input
                  className="mt-2 h-11 rounded-xl"
                  value={margem}
                  onChange={(e) => setMargem(e.target.value)}
                />
              </div>
            )}
          </div>
        </SaaSCard>

        {marketplace === 'ml' && (
          <div className="grid gap-4 md:grid-cols-2">
            <SaaSCard>
              <p className="text-sm text-slate-500">Peso cubado</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {resultado.pesoCubadoKg.toFixed(3).replace('.', ',')} kg
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Cálculo: comprimento × largura × altura ÷ 6000
              </p>
            </SaaSCard>

            <SaaSCard>
              <p className="text-sm text-slate-500">Peso considerado</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {resultado.pesoConsideradoKg.toFixed(3).replace('.', ',')} kg
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Maior valor entre peso real e cubado
              </p>
            </SaaSCard>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SaaSCard className="bg-white">
            <p className="text-sm text-slate-500">Lucro</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {formatBRL(resultado.lucro)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Margem real: {formatPercent(resultado.margemReal)}
            </p>
          </SaaSCard>

          <SaaSCard className="bg-white">
            <p className="text-sm text-slate-500">Comissão</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatBRL(resultado.comissao)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Percentual: {formatPercent(resultado.percentualComissao)}
            </p>
          </SaaSCard>

          <SaaSCard className="bg-white">
            <p className="text-sm text-slate-500">
              {marketplace === 'shopee' ? 'Taxa fixa' : 'Frete / custo operacional'}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatBRL(resultado.taxa)}
            </p>
            <p className="mt-3 text-sm text-slate-500">{resultado.descricaoTaxa}</p>
          </SaaSCard>

          <SaaSCard className="bg-white">
            <p className="text-sm text-slate-500">Custo base</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatBRL(resultado.custoBase)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Produto + embalagem + despesas
            </p>
          </SaaSCard>
        </div>
      </div>
    </div>
  )
}