import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Trash2, User, Tag, Plus } from 'lucide-react'

export default function SettingsTab() {
  const {
    categories,
    familyMembers,
    addCategory,
    deleteCategory,
    addFamilyMember,
    deleteFamilyMember
  } = useFinancial()

  // Estados Categoria
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState('expense')
  const [catColor, setCatColor] = useState('#10b981')
  const [submittingCat, setSubmittingCat] = useState(false)

  // Estados Membros da Família
  const [memberName, setMemberName] = useState('')
  const [submittingMember, setSubmittingMember] = useState(false)

  const handleAddCat = async (e) => {
    e.preventDefault()
    if (!catName) return
    setSubmittingCat(true)
    try {
      await addCategory({
        name: catName,
        type: catType,
        color: catColor
      })
      setCatName('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingCat(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!memberName) return
    setSubmittingMember(true)
    try {
      await addFamilyMember(memberName)
      setMemberName('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingMember(false)
    }
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gerenciamento de Categorias */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <Tag className="text-emerald-500 h-5 w-5" />
              Categorias
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Personalize suas categorias de receitas, despesas e investimentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddCat} className="space-y-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome</label>
                  <Input 
                    value={catName} 
                    onChange={(e) => setCatName(e.target.value)} 
                    placeholder="Ex: Alimentação, Bônus" 
                    required
                    className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
                  <Select value={catType} onValueChange={(val) => setCatType(val)}>
                    <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-650 dark:text-zinc-300">Selecione uma Cor:</label>
                  <input 
                    type="color" 
                    value={catColor} 
                    onChange={(e) => setCatColor(e.target.value)} 
                    className="h-8 w-12 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent cursor-pointer"
                  />
                </div>
                <Button type="submit" disabled={submittingCat} className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-100 gap-1.5 cursor-pointer">
                  <Plus size={16} /> Adicionar Categoria
                </Button>
              </div>
            </form>
            
            {/* Lista de Categorias */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {categories.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">Nenhuma categoria cadastrada.</p>
              ) : (
                categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }}></span>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-zinc-500">
                        ({c.type === 'income' ? 'Receita' : c.type === 'investment' ? 'Investimento' : 'Despesa'})
                      </span>
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteCategory(c.id)}
                      className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gerenciamento de Membros da Família */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="text-emerald-500 h-5 w-5" />
              Membros da Família
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Cadastre previamente as pessoas da família para associá-las aos lançamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddMember} className="space-y-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Familiar</label>
                <div className="flex gap-2">
                  <Input 
                    value={memberName} 
                    onChange={(e) => setMemberName(e.target.value)} 
                    placeholder="Ex: Lucas, Mariana, Filho" 
                    required
                    className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 flex-1"
                  />
                  <Button type="submit" disabled={submittingMember} className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-100 gap-1.5 cursor-pointer">
                    <Plus size={16} /> Adicionar
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Lista de Membros */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {familyMembers.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">Nenhum membro da família cadastrado.</p>
              ) : (
                familyMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-zinc-400" />
                      <span className="font-medium">{m.name}</span>
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteFamilyMember(m.id)}
                      className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
