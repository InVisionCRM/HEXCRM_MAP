"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconHome,
  IconUsers,
  IconCalendar,
  IconMap,
  IconSettings,
  IconPlus,
} from "@tabler/icons-react";

export default function NavigationDock() {
  const router = useRouter();

  const handleNavigation = (href: string, e?: React.MouseEvent) => {
    // Prevent default link behavior for special routes
    if (href.includes('view=') && e) {
      e.preventDefault();
    }
    
    // Add small delay to prevent stuttering
    setTimeout(() => {
      router.push(href);
    }, 50);
  };

  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
      onClick: (e: React.MouseEvent) => handleNavigation("/", e),
    },
    {
      title: "Customers",
      icon: (
        <IconUsers className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/onboards",
      onClick: (e: React.MouseEvent) => handleNavigation("/onboards", e),
    },
    {
      title: "Calendar",
      icon: (
        <IconCalendar className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/?view=calendar",
      onClick: (e: React.MouseEvent) => handleNavigation("/?view=calendar", e),
    },
    {
      title: "Territories",
      icon: (
        <IconMap className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/?view=territories", 
      onClick: (e: React.MouseEvent) => handleNavigation("/?view=territories", e),
    },
    {
      title: "Add Pin",
      icon: (
        <IconPlus className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => e.preventDefault(),
    },
    {
      title: "Settings",
      icon: (
        <IconSettings className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => e.preventDefault(),
    },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4">
      <FloatingDock items={links} />
    </div>
  );
} 