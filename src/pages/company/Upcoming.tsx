import PageLayout from "@/components/layout/PageLayout"
import EmptyState from "@/components/ui/EmptyState"


function Upcoming() {
  return (
    <>
      <PageLayout
      headTitle="pipeline"
      title="Upcoming Bookings"
      description="Keep track of expected bookings and upcoming revenue."
      >
        <EmptyState
          title="No booking data available"
          description="Upcoming bookings will appear here when booking data is connected to this workspace."
        />
      </PageLayout>
    </>
  )
}

export default Upcoming