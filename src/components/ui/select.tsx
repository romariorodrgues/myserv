/**
 * Select Component - Componente de seleção simples
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  placeholder = "Selecione...", 
  children, 
  disabled = false,
  className 
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  const contextValue = {
    value: selectedValue,
    onValueChange: handleValueChange,
    isOpen,
    setIsOpen,
  }

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={ref} className={cn("relative", className)}>
        <SelectTrigger disabled={disabled} placeholder={placeholder} />
        {isOpen && (
          <SelectContent>
            {children}
          </SelectContent>
        )}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger: React.FC<{ disabled?: boolean; placeholder?: string }> = ({ 
  disabled = false, 
  placeholder = "Selecione..." 
}) => {
  const { value, isOpen, setIsOpen } = React.useContext(SelectContext)
  
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>span]:line-clamp-1"
      )}
    >
      <span className={cn(!value && "text-muted-foreground")}>
        {value || placeholder}
      </span>
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
    </button>
  )
}

const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={cn(
      "absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
      "animate-in fade-in-0 zoom-in-95"
    )}>
      <div className="max-h-60 overflow-auto p-1">
        {children}
      </div>
    </div>
  )
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => {
  const { onValueChange, value: selectedValue } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  return (
    <div
      onClick={() => onValueChange?.(value)}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          ✓
        </span>
      )}
      <span>{children}</span>
    </div>
  )
}

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

export {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
}
