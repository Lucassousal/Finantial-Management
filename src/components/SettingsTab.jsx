import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Trash2, User, Tag, Plus, Edit2 } from 'lucide-react'
import { ConfirmDialog } from './ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'


export default function SettingsTab() {
  const {
    categories,
    familyMembers,
    addCategory,
    deleteCategory,
    updateCategory,
    addFamilyMember,
    deleteFamilyMember,
    updateFamilyMember
  } = useFinancial()

  // Estados Categoria
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState('expense')
  const [catColor, setCatColor] = useState('#10b981')
  const [submittingCat, setSubmittingCat] = useState(false)

  // Estados Membros da Família
  const [memberName, setMemberName] = useState('')
  const [submittingMember, setSubmittingMember] = useState(false)

  // Estados Edição Categoria
  const [isEditCatOpen, setIsEditCatOpen] = useState(false)
  const [editCatId, setEditCatId] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatType, setEditCatType] = useState('expense')
  const [editCatColor, setEditCatColor] = useState('#10b981')
  const [submittingEditCat, setSubmittingEditCat] = useState(false)

  // Estados Edição Membro
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false)
  const [editMemberId, setEditMemberId] = useState(null)
  const [editMemberName, setEditMemberName] = useState('')
  const [submittingEditMember, setSubmittingEditMember] = useState(false)

  const handleStartEditCat = (cat) => {
    setEditCatId(cat.id)
    setEditCatName(cat.name)
    setEditCatType(cat.type)
    setEditCatColor(cat.color)
    setIsEditCatOpen(true)
  }

  const handleSaveEditCat = async (e) => {
    e.preventDefault()
    if (!editCatName) return
    setSubmittingEditCat(true)
    try {
      await updateCategory(editCatId, {
        name: editCatName,
        type: editCatType,
        color: editCatColor
      })
      setIsEditCatOpen(false)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar alterações da categoria.")
    } finally {
      setSubmittingEditCat(false)
    }
  }

  const handleStartEditMember = (m) => {
    setEditMemberId(m.id)
    setEditMemberName(m.name)
    setIsEditMemberOpen(true)
  }

  const handleSaveEditMember = async (e) => {
    e.preventDefault()
    if (!editMemberName) return
    setSubmittingEditMember(true)
    try {
      await updateFamilyMember(editMemberId, editMemberName)
      setIsEditMemberOpen(false)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar alterações do membro da família.")
    } finally {
      setSubmittingEditMember(false)
    }
  }

  // Estados de confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmType, setDeleteConfirmType] = useState('') // 'category' ou 'member'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [deleteConfirmDesc, setDeleteConfirmDesc] = useState('')

  const confirmDeleteCategory = (id, name) => {
    setDeleteConfirmId(id)
    setDeleteConfirmType('category')
    setDeleteConfirmTitle('Confirmar Exclusão de Categoria')
    setDeleteConfirmDesc(`Tem certeza de que deseja excluir a categoria "${name}"? Todas as transações associadas a ela ficarão sem categoria (Geral).`)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteMember = (id, name) => {
    setDeleteConfirmId(id)
    setDeleteConfirmType('member')
    setDeleteConfirmTitle('Confirmar Exclusão de Membro da Família')
    setDeleteConfirmDesc(`Tem certeza de que deseja excluir o membro "${name}"? As transações associadas a este membro não serão excluídas, mas ficarão sem associação.`)
    setDeleteConfirmOpen(true)
  }

  const executeDelete = async () => {
    if (!deleteConfirmId) return
    try {
      if (deleteConfirmType === 'category') {
        await deleteCategory(deleteConfirmId)
      } else if (deleteConfirmType === 'member') {
        await deleteFamilyMember(deleteConfirmId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteConfirmId(null)
      setDeleteConfirmType('')
    }
  }


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
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStartEditCat(c)}
                        className="h-7 w-7 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => confirmDeleteCategory(c.id, c.name)}
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

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
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStartEditMember(m)}
                        className="h-7 w-7 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => confirmDeleteMember(m.id, m.name)}
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title={deleteConfirmTitle}
        description={deleteConfirmDesc}
      />

      {/* Modal Edição Categoria */}
      <Dialog open={isEditCatOpen} onOpenChange={setIsEditCatOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditCat} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome</label>
              <Input 
                value={editCatName} 
                onChange={(e) => setEditCatName(e.target.value)} 
                required
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
              <Select value={editCatType} onValueChange={(val) => setEditCatType(val)}>
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

            <div className="flex items-center gap-2 pt-1">
              <label className="text-sm text-zinc-650 dark:text-zinc-300">Selecione uma Cor:</label>
              <input 
                type="color" 
                value={editCatColor} 
                onChange={(e) => setEditCatColor(e.target.value)} 
                className="h-8 w-12 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent cursor-pointer"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditCatOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingEditCat} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
                {submittingEditCat ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edição Membro da Família */}
      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
          <DialogHeader>
            <DialogTitle>Editar Membro da Família</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditMember} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Familiar</label>
              <Input 
                value={editMemberName} 
                onChange={(e) => setEditMemberName(e.target.value)} 
                required
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditMemberOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingEditMember} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
                {submittingEditMember ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

