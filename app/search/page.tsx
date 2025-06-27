import { Sidebar } from "@/components/sidebar"
import { SearchResults } from "@/components/search-results"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q: string }
}) {
  const query = searchParams.q || ""

  return (
    <div className="flex">
      <Sidebar className="hidden md:block w-64 shrink-0" />
      <div className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
        <SearchResults query={query} />
      </div>
    </div>
  )
}
