import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import CustomerTable, {
  type Customer,
} from "@/features/customers/components/CustomerTable";
import {
  getCustomers,
  type CustomersResponse,
} from "@/services/companyServices";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import toast from "react-hot-toast";
import { viewCustomers } from "@/services/viewonlyService";
import MergeCustomersModal from "@/features/customers/components/MergeCustomersModal";
import { useAppSelector } from "@/app/hooks";
import Button from "@/components/ui/Button";

function Customers() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<CustomersResponse["pagination"]>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [mergeSource, setMergeSource] = useState<Customer | null>(null);
  const role = useAppSelector((state) => state.auth.user?.role);
  // merging changes the company's data: company admins only, never from a platform-admin view
  const canMerge = !workspaceId && role === "company_admin";

  useEffect(() => {
    let cancelled = false;

    async function fetchCustomers() {
      setLoading(true);
      setError("");

      try {
        const response = workspaceId
          ? await viewCustomers(workspaceId, page)
          : await getCustomers(page);
        const result = response.data;
        if (
          !Array.isArray(result?.data) ||
          !result.pagination ||
          typeof result.pagination.page !== "number" ||
          typeof result.pagination.limit !== "number" ||
          typeof result.pagination.total !== "number" ||
          typeof result.pagination.pages !== "number"
        ) {
          throw new Error("Unexpected customer API response format.");
        }

        if (cancelled) return;
        setCustomers(result.data);
        setPagination(result.pagination);
      } catch (requestError) {
        if (cancelled) return;
        const message = getRequestErrorMessage(requestError);
        setError(`Unable to load customers: ${message}`);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchCustomers();

    return () => {
      cancelled = true;
    };
  }, [page, retryCount, workspaceId]);


  // useEffect(()=>{
  //   if(customers){ 
  //     customers.map( (data, index) => getCustomerJourney(data.id) )
  //   }
  // }, [customers])


  return (
    <PageLayout
      title="Customers"
      headTitle="Audience"
      description="Review customer activity and purchase history."
    >
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
        >
          <span>{error}</span>
          <Button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="font-medium underline"
          >
            Retry
          </Button>
        </div>
      )}
      <CustomerTable
        customers={customers}
        onMerge={canMerge ? setMergeSource : undefined}
        loading={loading}
        total={pagination.total}
        pagination={{
          ...pagination,
          isLoading: loading,
          onPageChange: setPage,
        }}
      />
      {mergeSource && (
        <MergeCustomersModal
          source={mergeSource}
          candidates={customers}
          onClose={() => setMergeSource(null)}
          onMerged={() => setRetryCount((count) => count + 1)}
        />
      )}
    </PageLayout>
  );
}

export default Customers;
