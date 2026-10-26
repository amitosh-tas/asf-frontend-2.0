import PageLayout from "@/components/layout/PageLayout"
import EmptyState from "@/components/ui/EmptyState"




function Transactions() {
  return (
    <>
      <PageLayout
      headTitle="sales"
      title="Transactions"
      description="Browse payment activity and transaction details."
      >
        <EmptyState
          title="Transaction data is not connected yet"
          description="Transactions will be listed here when transaction records are available for this workspace."
        />
      </PageLayout>
    </>
  )
}

export default Transactions