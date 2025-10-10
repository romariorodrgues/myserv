import { SubscriptionResponse } from "@/app/api/payments/subscribe/route";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { useMemo } from "react";

type useVerifyPlanResponse = {
  plan: string;
  isExpired: boolean;
  subscription?: SubscriptionResponse | null;
};

function useVerifyPlan(): useVerifyPlanResponse {
  const { data: subscription } = useQuery<SubscriptionResponse | null>({
    queryKey: ["subscription"],
    queryFn: async () => {
      try {
        const { data } = await axios.get<
          any,
          AxiosResponse<SubscriptionResponse>,
          any
        >("/api/payments/subscribe");

        return data;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  const isExpired = useMemo(() => !subscription, [subscription]);

  return {
    plan: subscription?.plan?.name || "Start",
    isExpired,
    subscription,
  };
}

export default useVerifyPlan;
