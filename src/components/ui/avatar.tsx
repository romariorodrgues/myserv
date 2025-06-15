/**
 * Avatar UI Component
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Reusable avatar component for user profiles
 */

import * as React from "react"
import Image from "next/image"
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
    width?: number
    height?: number
  }
>(({ className, alt = "", src, width = 40, height = 40, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("aspect-square h-full w-full relative", className)}
  >
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="object-cover rounded-full"
      {...props}
    />
  </div>
))
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
