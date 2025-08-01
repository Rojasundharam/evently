import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  [key: string]: string | undefined
}

export function toast({ title, description, variant = "default", ...props }: ToastProps) {
  return sonnerToast(title || "", {
    description,
    className: variant === "destructive" 
      ? "bg-destructive text-destructive-foreground" 
      : variant === "success"
      ? "bg-success text-success-foreground"
      : "",
    ...props
  })
}

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (message: string) => 
      toast({ 
        title: "Error", 
        description: message, 
        variant: "destructive" 
      }),
    success: (message: string) => 
      toast({ 
        title: "Success", 
        description: message, 
        variant: "success" 
      }),
  }
} 