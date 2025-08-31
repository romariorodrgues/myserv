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
      const { data } = await axios.get<
        any,
        AxiosResponse<SubscriptionResponse>,
        any
      >("/api/payments/subscribe");

      return data;
    },
  });

  const isExpired = useMemo(() => !subscription, [subscription]);

  return {
    plan: subscription?.plan?.name || "Start",
    isExpired,
    subscription,
  };
}

export default useVerifyPlan;
