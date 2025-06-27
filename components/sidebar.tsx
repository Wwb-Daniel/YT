"use client"

import type React from "react"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, Compass, Clock, ThumbsUp, History, PlaySquare, User, Upload } from "lucide-react"
import { usePathname } from "next/navigation"
import { useSupabase } from "./supabase-provider"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useSupabase()

  const routes = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Explore",
      icon: Compass,
      href: "/explore",
      active: pathname === "/explore",
    },
    {
      label: "Upload Video",
      icon: Upload,
      href: "/upload",
      active: pathname === "/upload",
      requireAuth: true,
    },
    {
      label: "Subscriptions",
      icon: PlaySquare,
      href: "/subscriptions",
      active: pathname === "/subscriptions",
      requireAuth: true,
    },
    {
      label: "Library",
      icon: PlaySquare,
      href: "/library",
      active: pathname === "/library",
      requireAuth: true,
    },
    {
      label: "History",
      icon: History,
      href: "/history",
      active: pathname === "/history",
      requireAuth: true,
    },
    {
      label: "Liked Videos",
      icon: ThumbsUp,
      href: "/liked",
      active: pathname === "/liked",
      requireAuth: true,
    },
    {
      label: "Watch Later",
      icon: Clock,
      href: "/watch-later",
      active: pathname === "/watch-later",
      requireAuth: true,
    },
    {
      label: "Your Profile",
      icon: User,
      href: "/profile",
      active: pathname === "/profile",
      requireAuth: true,
    },
  ]

  return (
    <div className={cn("pb-12 border-r h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="space-y-1">
              {routes.map((route) => {
                if (route.requireAuth && !user) return null

                return (
                  <Button
                    key={route.href}
                    variant={route.active ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={route.href}>
                      <route.icon className="mr-2 h-4 w-4" />
                      {route.label}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
