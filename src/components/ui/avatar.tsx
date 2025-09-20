/**
 * Avatar UI Component
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Reusable avatar component for user profiles
 */

import * as React from "react"
import Image from "next/image"
import { cdnImageUrl } from "@/lib/cdn"
import { cn } from "@/utils"

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLDivElement,
  React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string
    size?: number
  }
>(({ className, alt = "", src, size = 96, onError, ...props }, ref) => {
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setFailed(false)
  }, [src])

  const finalSrc = failed ? '' : cdnImageUrl(src)
  if (!finalSrc) {
    return null
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setFailed(true)
    onError?.(event)
  }

  return (
    <div
      ref={ref}
      className={cn("absolute inset-0 h-full w-full z-10", className)}
      style={{ width: '100%', height: '100%' }}
    >
      <Image
        src={finalSrc}
        alt={alt}
        fill
        sizes={`${size}px`}
        quality={95}
        className="object-cover rounded-full"
        onError={handleError}
        {...(props as any)}
      />
    </div>
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-muted z-0",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
