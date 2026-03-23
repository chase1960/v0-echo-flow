"use client";

import Link from "next/link";
import { Video, Sparkles, FileText, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Video className="size-6 text-foreground" strokeWidth={1.5} />
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none">
              <Avatar className="size-9 bg-rose-500 cursor-pointer hover:ring-2 hover:ring-rose-500/20 transition-all">
                <AvatarFallback className="bg-rose-500 text-white text-sm font-medium">
                  R
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Account</p>
                <p className="text-xs text-muted-foreground">
                  fan200428@gmail.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Sparkles className="size-4" />
              <span>Upgrade Plan</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/videos">
                <Video className="size-4" />
                <span>Videos</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/notes">
                <FileText className="size-4" />
                <span>Notes</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="size-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
