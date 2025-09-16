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
>(({ className, alt = "", src, size = 40, ...props }, ref) => {
  const finalSrc = cdnImageUrl(src)
  return (
    <div
      ref={ref}
      className={cn("relative h-full w-full", className)}
      style={{ width: '100%', height: '100%' }}
    >
      {finalSrc ? (
        <Image
          src={finalSrc}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover rounded-full"
          {...(props as any)}
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
          ?
        </div>
      )}
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
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
