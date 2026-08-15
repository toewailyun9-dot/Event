import Link from 'next/link'
import { HandCoins } from 'lucide-react'
import CreateSponsorButton from '@/components/admin/createSponsorButton'
import SponsorsTable from '@/components/admin/sponsorsTable'

export default async function AdminSponsorsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="p-6 bg-card rounded-xl shadow-lg border border-border space-y-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <HandCoins className="w-6 h-6 text-amber-500" />
                <h1 className="text-2xl font-bold text-foreground">
                  Sponsors Management
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Event များအား Sponsorship ပြုလုပ်သော Company များကို စီမံခန့်ခွဲပါ။
              </p>
            </div>
            <CreateSponsorButton />
          </div>
        </div>

        <SponsorsTable />
      </div>
    </div>
  )
}