import { CRMNav } from '@crm/components/CRMNav'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0 pt-6 px-6 pb-8">
      <CRMNav />
      {children}
    </div>
  )
}
