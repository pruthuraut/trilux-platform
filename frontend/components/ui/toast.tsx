import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 p-0 sm:max-w-[400px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-9 shadow-2xl backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default:
          "border-border/50 bg-background/95 text-foreground shadow-black/5 dark:shadow-black/20 dark:bg-background/90",
        success:
          "border-emerald-200/50 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/90 dark:text-emerald-100",
        destructive:
          "border-red-200/50 bg-red-50/95 text-red-900 dark:border-red-800/50 dark:bg-red-950/90 dark:text-red-100",
        warning:
          "border-amber-200/50 bg-amber-50/95 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/90 dark:text-amber-100",
        info:
          "border-blue-200/50 bg-blue-50/95 text-blue-900 dark:border-blue-800/50 dark:bg-blue-950/90 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Icon component based on variant
const ToastIcon = ({ variant }: { variant?: string | null }) => {
  const iconClass = "h-5 w-5 mt-0.5 flex-shrink-0"
  switch (variant) {
    case "success":
      return <CheckCircle2 className={cn(iconClass, "text-emerald-600 dark:text-emerald-400")} />
    case "destructive":
      return <AlertCircle className={cn(iconClass, "text-red-600 dark:text-red-400")} />
    case "warning":
      return <AlertTriangle className={cn(iconClass, "text-amber-600 dark:text-amber-400")} />
    case "info":
      return <Info className={cn(iconClass, "text-blue-600 dark:text-blue-400")} />
    default:
      return <CheckCircle2 className={cn(iconClass, "text-primary")} />
  }
}

// Progress bar that animates from full to empty
const ToastProgress = ({ variant, duration = 5000 }: { variant?: string | null; duration?: number }) => {
  const barColor = (() => {
    switch (variant) {
      case "success": return "bg-emerald-500 dark:bg-emerald-400"
      case "destructive": return "bg-red-500 dark:bg-red-400"
      case "warning": return "bg-amber-500 dark:bg-amber-400"
      case "info": return "bg-blue-500 dark:bg-blue-400"
      default: return "bg-primary"
    }
  })()

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-xl bg-black/5 dark:bg-white/5">
      <div
        className={cn("h-full rounded-full opacity-80", barColor)}
        style={{
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
    </div>
  )
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), variant, className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-300/40 group-[.destructive]:hover:border-red-400/30 group-[.destructive]:hover:bg-red-600 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-lg p-1.5 text-foreground/40 opacity-0 transition-all hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring group-hover:opacity-100 group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-600 group-[.success]:text-emerald-400 group-[.success]:hover:text-emerald-600 group-[.warning]:text-amber-400 group-[.warning]:hover:text-amber-600 group-[.info]:text-blue-400 group-[.info]:hover:text-blue-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 leading-relaxed", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
  ToastProgress,
}
