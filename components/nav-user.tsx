"use client"

import CreditCard2 from "@/components/icons/credit-card-2"
import CircleLogout from "@/components/icons/circle-logout"
import Shield2 from "@/components/icons/shield-2"
import DotsVertical from "@/components/icons/dots-vertical"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { signOut, useSession } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"
import { isUserAdmin } from "@/lib/navigation"
import { useEffect, useState } from "react"
import { getAutumnCustomer } from "@/app/actions/primary"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    plan?: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { data: session } = useSession()
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("Free")
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  // Check if user is admin
  const userIsAdmin = isUserAdmin(session?.user?.role || "user")

  // Fetch user's subscription data from Autumn
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!session?.user) {
        setIsLoadingSubscription(false)
        return
      }

      try {
        const response = await getAutumnCustomer()
        
        if (response.customer) {
          const customer = response.customer
          
          // Find active product
          const activeProduct = customer.products?.find(
            product => product.status === "active" && !product.canceled_at
          )

          if (activeProduct) {
            // Capitalize the product name
            const planName = activeProduct.name 
              ? activeProduct.name.charAt(0).toUpperCase() + activeProduct.name.slice(1) 
              : "Free"
            setSubscriptionPlan(planName)
          } else {
            setSubscriptionPlan("Free")
          }
        } else {
          console.error("Failed to fetch customer data:", response.error)
          setSubscriptionPlan("Free")
        }
      } catch (error) {
        console.error("Error fetching customer data:", error)
        setSubscriptionPlan("Free")
      } finally {
        setIsLoadingSubscription(false)
      }
    }

    fetchCustomerData()
  }, [session?.user])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Use the fetched subscription plan or fallback to the passed plan or "Free"
  const displayPlan = isLoadingSubscription ? "..." : subscriptionPlan

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-[#151516] data-[state=open]:text-white hover:bg-[#1c1c1e] focus:ring-0 focus:outline-none"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{user.name}</span>
                  {userIsAdmin && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5 flex items-center gap-1 bg-[#151516] text-white">
                      <Shield2 className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {displayPlan} Plan
                </span>
              </div>
              <DotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-[#151516] text-white border-[#2c2c2e]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{user.name}</span>
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayPlan} Plan
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2c2c2e]" />
            <DropdownMenuItem 
              onClick={() => router.push("/settings")} 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 focus:ring-0 focus:outline-none"
            >
              <CreditCard2 className="h-4 w-4" />
              Manage Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2c2c2e]" />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 focus:ring-0 focus:outline-none">
              <CircleLogout className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
