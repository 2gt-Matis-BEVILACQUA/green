import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("border border-gray-200 bg-white shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#4b5563]">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-[#4b5563]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#09090b]">{value}</div>
        {description && (
          <p className="text-xs text-[#4b5563] mt-1">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs mt-1",
              trend.isPositive ? "text-emerald-deep" : "text-coral"
            )}
          >
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

