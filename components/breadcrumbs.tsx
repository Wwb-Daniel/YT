import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
        <Home className="w-4 h-4" />
      </Link>

      {items.slice(1).map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          {index === items.length - 2 ? (
            <span className="font-medium text-foreground truncate max-w-[200px]" title={item.label}>
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
              title={item.label}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
