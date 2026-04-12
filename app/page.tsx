'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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

export default function Page() {
  const [modoCalculo, setModoCalculo] = useState<'ideal' | 'alvo'>('ideal')
  const [precoAlvo, setPrecoAlvo] = useState('0')
  const [custoProduto, setCustoProduto] = useState('0')
  const [custoEmbalagem, setCustoEmbalagem] = useState('0')
  const [outrasDespesas, setOutrasDespesas] = useState('0')
  const [freteExtra, setFreteExtra] = useState('0')
  const [margemDesejada, setMargemDesejada] = useState('20')
  const [impostoPercentual, setImpostoPercentual] = useState('0')

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
    setPrecoAlvo('0')
    setCustoProduto('0')
    setCustoEmbalagem('0')
    setOutrasDespesas('0')
    setFreteExtra('0')
    setMargemDesejada('20')
    setImpostoPercentual('0')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Calculadora de Precificação Shopee
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            Cálculo automático com comissão e taxa fixa por faixa de preço.
          </p>
        </div>

        <Card className="rounded-2xl shadow-sm">
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
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Custos e parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  {modoCalculo === 'alvo' ? 'Preço informado' : 'Preço ideal de venda'}
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatBRL(resultado.precoIdeal)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Custo total</p>
                  <p className="font-semibold text-slate-900">{formatBRL(resultado.custoBase)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Lucro estimado</p>
                  <p className="font-semibold text-slate-900">{formatBRL(resultado.lucro)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Comissão Shopee</p>
                  <p className="font-semibold text-slate-900">
                    {formatBRL(resultado.comissaoShopee)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Taxa fixa por pedido</p>
                  <p className="font-semibold text-slate-900">
                    {formatBRL(resultado.taxaFixaPedido)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Imposto</p>
                  <p className="font-semibold text-slate-900">
                    {formatBRL(resultado.impostoValor)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Margem real</p>
                  <p className="font-semibold text-slate-900">
                    {formatNumber(resultado.margemReal)}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Percentual de comissão</p>
                  <p className="font-semibold text-slate-900">
                    {formatNumber(resultado.percentualComissao)}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Faixa aplicada</p>
                  <p className="font-semibold text-slate-900">{resultado.faixaShopee}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={limpar} className="rounded-xl">
            Limpar dados
          </Button>
        </div>
      </div>
    </div>
  )
}