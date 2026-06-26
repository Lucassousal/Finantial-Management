import React from 'react'
import { Button } from './button'

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-full mb-4">
        {Icon && <Icon size={32} className="text-zinc-400 dark:text-zinc-500" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white shadow-sm cursor-pointer">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
