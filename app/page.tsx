'use client'

import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type SavedProduct = {
  id: string
  nome: string
  modo: 'ideal' | 'alvo'
  preco: number
  custoTotal: number
  lucro: number
  margemReal: number
  comissao: number
  taxaFixa: number
  imposto: number
  criadoEm: string
}

function toNumber(value: string) {
  const normalized = value.replace(',', '.')
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : 0
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0)
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0)
}

function getShopeeFees(precoVenda: number) {
  if (precoVenda < 80) {
    return { percentual: 0.2, taxaFixa: 4, faixa: 'Abaixo de R$ 80,00' }
  }

  if (precoVenda < 100) {
    return { percentual: 0.14, taxaFixa: 16, faixa: 'De R$ 80,00 até R$ 99,99' }
  }

  if (precoVenda < 200) {
    return { percentual: 0.14, taxaFixa: 20, faixa: 'De R$ 100,00 até R$ 199,99' }
  }

  return { percentual: 0.14, taxaFixa: 26, faixa: 'R$ 200,00 ou mais' }
}

const STORAGE_KEY = 'shopee_saved_products_v1'

export default function Page() {
  const [modoCalculo, setModoCalculo] = useState<'ideal' | 'alvo'>('ideal')
  const [nomeProduto, setNomeProduto] = useState('')
  const [precoAlvo, setPrecoAlvo] = useState('0')
  const [custoProduto, setCustoProduto] = useState('0')
  const [custoEmbalagem, setCustoEmbalagem] = useState('0')
  const [outrasDespesas, setOutrasDespesas] = useState('0')
  const [freteExtra, setFreteExtra] = useState('0')
  const [margemDesejada, setMargemDesejada] = useState('20')
  const [impostoPercentual, setImpostoPercentual] = useState('0')
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setSavedProducts(JSON.parse(raw))
      } catch {
        setSavedProducts([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProducts))
  }, [savedProducts])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const resultado = useMemo(() => {
    const custo = toNumber(custoProduto)
    const embalagem = toNumber(custoEmbalagem)
    const despesas = toNumber(outrasDespesas)
    const frete = toNumber(freteExtra)
    const margem = toNumber(margemDesejada) / 100
    const imposto = toNumber(impostoPercentual) / 100

    const custoBase = custo + embalagem + despesas + frete

    let precoCalculado = 0

    if (modoCalculo === 'alvo') {
      precoCalculado = toNumber(precoAlvo)
    } else {
      precoCalculado = custoBase > 0 ? custoBase * 1.5 : 0

      for (let i = 0; i < 80; i++) {
        const taxaAtual = getShopeeFees(precoCalculado)
        const denominador = 1 - taxaAtual.percentual - imposto - margem

        if (denominador <= 0) {
          precoCalculado = 0
          break
        }

        precoCalculado = (custoBase + taxaAtual.taxaFixa) / denominador
      }
    }

    const taxaFinal = getShopeeFees(precoCalculado)
    const comissaoShopee = precoCalculado * taxaFinal.percentual
    const taxaFixaPedido = taxaFinal.taxaFixa
    const impostoValor = precoCalculado * imposto
    const lucro = precoCalculado - custoBase - comissaoShopee - taxaFixaPedido - impostoValor
    const margemReal = precoCalculado > 0 ? (lucro / precoCalculado) * 100 : 0

    return {
      custoBase,
      precoIdeal: precoCalculado,
      comissaoShopee,
      taxaFixaPedido,
      impostoValor,
      lucro,
      margemReal,
      percentualComissao: taxaFinal.percentual * 100,
      faixaShopee: taxaFinal.faixa,
    }
  }, [
    custoProduto,
    custoEmbalagem,
    outrasDespesas,
    freteExtra,
    margemDesejada,
    impostoPercentual,
    modoCalculo,
    precoAlvo,
  ])

  const limpar = () => {
    setModoCalculo('ideal')
    setNomeProduto('')
    setPrecoAlvo('0')
    setCustoProduto('0')
    setCustoEmbalagem('0')
    setOutrasDespesas('0')
    setFreteExtra('0')
    setMargemDesejada('20')
    setImpostoPercentual('0')
  }

  const salvarProduto = () => {
    const novo: SavedProduct = {
      id: crypto.randomUUID(),
      nome: nomeProduto.trim() || `Produto ${savedProducts.length + 1}`,
      modo: modoCalculo,
      preco: resultado.precoIdeal,
      custoTotal: resultado.custoBase,
      lucro: resultado.lucro,
      margemReal: resultado.margemReal,
      comissao: resultado.comissaoShopee,
      taxaFixa: resultado.taxaFixaPedido,
      imposto: resultado.impostoValor,
      criadoEm: new Date().toLocaleString('pt-BR'),
    }

    setSavedProducts((prev) => [novo, ...prev])
  }

  const removerProduto = (id: string) => {
    setSavedProducts((prev) => prev.filter((item) => item.id !== id))
  }

  const exportarPDF = () => {
    const doc = new jsPDF()

    let y = 18
    const line = (text: string, gap = 8) => {
      doc.text(text, 14, y)
      y += gap
    }

    doc.setFontSize(18)
    line('Calculadora de Precificação Shopee', 10)

    doc.setFontSize(11)
    line(`Modo: ${modoCalculo === 'ideal' ? 'Preço ideal' : 'Preço alvo'}`)
    line(`Produto: ${nomeProduto || 'Sem nome'}`)
    line(`Preço: ${formatBRL(resultado.precoIdeal)}`)
    line(`Custo total: ${formatBRL(resultado.custoBase)}`)
    line(`Lucro estimado: ${formatBRL(resultado.lucro)}`)
    line(`Comissão Shopee: ${formatBRL(resultado.comissaoShopee)}`)
    line(`Taxa fixa: ${formatBRL(resultado.taxaFixaPedido)}`)
    line(`Imposto: ${formatBRL(resultado.impostoValor)}`)
    line(`Margem real: ${formatNumber(resultado.margemReal)}%`)
    line(`Faixa aplicada: ${resultado.faixaShopee}`, 12)

    if (savedProducts.length > 0) {
      line('Produtos salvos:', 10)

      savedProducts.slice(0, 10).forEach((item, index) => {
        line(`${index + 1}. ${item.nome} | ${formatBRL(item.preco)} | lucro ${formatBRL(item.lucro)}`, 7)
      })
    }

    doc.save('precificacao-shopee.pdf')
  }

  const lucroTotalSalvo = savedProducts.reduce((acc, item) => acc + item.lucro, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-[1px] shadow-lg">
          <div className="rounded-3xl bg-white p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  Marketplace • Shopee • PWA
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Calculadora de Precificação Shopee
                </h1>
                <p className="max-w-2xl text-sm text-slate-600 md:text-base">
                  Agora com instalação no celular, salvamento local de produtos, exportação em PDF e layout comercial.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:min-w-[340px]">
                <div className="rounded-2xl bg-slate-900 p-4 text-white">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Preço</p>
                  <p className="mt-1 text-xl font-bold">{formatBRL(resultado.precoIdeal)}</p>
                </div>
                <div className="rounded-2xl bg-emerald-600 p-4 text-white">
                  <p className="text-xs uppercase tracking-wide text-emerald-100">Lucro</p>
                  <p className="mt-1 text-xl font-bold">{formatBRL(resultado.lucro)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border-orange-100 shadow-sm">
          <CardHeader>
            <CardTitle>Modo de cálculo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <Button
              type="button"
              onClick={() => setModoCalculo('ideal')}
              variant={modoCalculo === 'ideal' ? 'default' : 'outline'}
              className="rounded-xl"
            >
              Preço ideal
            </Button>

            <Button
              type="button"
              onClick={() => setModoCalculo('alvo')}
              variant={modoCalculo === 'alvo' ? 'default' : 'outline'}
              className="rounded-xl"
            >
              Preço alvo
            </Button>

            <div className="md:ml-auto flex flex-wrap gap-2">
              <Button type="button" onClick={salvarProduto} className="rounded-xl bg-orange-600 hover:bg-orange-700">
                Salvar produto
              </Button>
              <Button type="button" variant="outline" onClick={exportarPDF} className="rounded-xl">
                Exportar PDF
              </Button>
              <Button type="button" variant="outline" onClick={limpar} className="rounded-xl">
                Limpar dados
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Custos e parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label>Nome ou referência do produto</Label>
                <Input
                  value={nomeProduto}
                  onChange={(e) => setNomeProduto(e.target.value)}
                  placeholder="Ex.: Taça gin 550ml"
                />
              </div>

              {modoCalculo === 'alvo' && (
                <div className="md:col-span-2 space-y-2">
                  <Label>Preço alvo de venda (R$)</Label>
                  <Input
                    value={precoAlvo}
                    onChange={(e) => setPrecoAlvo(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Custo do produto (R$)</Label>
                <Input
                  value={custoProduto}
                  onChange={(e) => setCustoProduto(e.target.value)}
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-2">
                <Label>Custo da embalagem (R$)</Label>
                <Input
                  value={custoEmbalagem}
                  onChange={(e) => setCustoEmbalagem(e.target.value)}
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-2">
                <Label>Outras despesas (R$)</Label>
                <Input
                  value={outrasDespesas}
                  onChange={(e) => setOutrasDespesas(e.target.value)}
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-2">
                <Label>Frete/despesa extra (R$)</Label>
                <Input
                  value={freteExtra}
                  onChange={(e) => setFreteExtra(e.target.value)}
                  inputMode="decimal"
                />
              </div>

              {modoCalculo === 'ideal' && (
                <div className="space-y-2">
                  <Label>Margem desejada (%)</Label>
                  <Input
                    value={margemDesejada}
                    onChange={(e) => setMargemDesejada(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Imposto (%)</Label>
                <Input
                  value={impostoPercentual}
                  onChange={(e) => setImpostoPercentual(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white">
                <p className="text-sm text-orange-100">
                  {modoCalculo === 'alvo' ? 'Preço informado' : 'Preço ideal de venda'}
                </p>
                <p className="mt-1 text-4xl font-bold">{formatBRL(resultado.precoIdeal)}</p>
                <p className="mt-2 text-sm text-orange-100">{resultado.faixaShopee}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Custo total</p>
                  <p className="text-lg font-semibold text-slate-900">{formatBRL(resultado.custoBase)}</p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">Lucro estimado</p>
                  <p className="text-lg font-semibold text-emerald-800">{formatBRL(resultado.lucro)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Comissão Shopee</p>
                  <p className="text-lg font-semibold text-slate-900">{formatBRL(resultado.comissaoShopee)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Taxa fixa por pedido</p>
                  <p className="text-lg font-semibold text-slate-900">{formatBRL(resultado.taxaFixaPedido)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Imposto</p>
                  <p className="text-lg font-semibold text-slate-900">{formatBRL(resultado.impostoValor)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Margem real</p>
                  <p className="text-lg font-semibold text-slate-900">{formatNumber(resultado.margemReal)}%</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Percentual comissão</p>
                  <p className="text-lg font-semibold text-slate-900">{formatNumber(resultado.percentualComissao)}%</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Modo atual</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {modoCalculo === 'ideal' ? 'Preço ideal' : 'Preço alvo'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-orange-100 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>Produtos salvos</CardTitle>
              <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
                Lucro total salvo: {formatBRL(lucroTotalSalvo)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {savedProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
                Nenhum produto salvo ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="pb-3 pr-4">Produto</th>
                      <th className="pb-3 pr-4">Modo</th>
                      <th className="pb-3 pr-4">Preço</th>
                      <th className="pb-3 pr-4">Lucro</th>
                      <th className="pb-3 pr-4">Margem</th>
                      <th className="pb-3 pr-4">Data</th>
                      <th className="pb-3">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedProducts.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="py-3 pr-4">{item.modo === 'ideal' ? 'Ideal' : 'Alvo'}</td>
                        <td className="py-3 pr-4">{formatBRL(item.preco)}</td>
                        <td className="py-3 pr-4 text-emerald-700">{formatBRL(item.lucro)}</td>
                        <td className="py-3 pr-4">{formatNumber(item.margemReal)}%</td>
                        <td className="py-3 pr-4">{item.criadoEm}</td>
                        <td className="py-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => removerProduto(item.id)}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}