import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { AddRecurringRuleForm } from '../forms/AddRecurringRuleForm'

export default function AddRecurringRuleModal({ 
  isOpen, 
  onClose, 
  addRecurringRule, 
  categories, 
  familyMembers 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 w-full sm:max-w-xl md:max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-xl">Nova Regra Recorrente</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
            Configure despesas ou receitas repetidas mensalmente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <AddRecurringRuleForm 
            addRecurringRule={addRecurringRule}
            categories={categories}
            familyMembers={familyMembers}
            onSuccess={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
