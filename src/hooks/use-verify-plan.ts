import { SubscriptionResponse } from "@/app/api/payments/subscribe/route";
import { Plan } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { useMemo } from "react";

type useVerifyPlanResponse = {
  plan: string;
  isExpired: boolean;
  subscriptions: SubscriptionResponse[]
};

function useVerifyPlan(): useVerifyPlanResponse {
  const { data: subscriptions } = useQuery<SubscriptionResponse[]>({
    queryKey: ["subscriptions"],
    initialData: [],
    queryFn: async () => {
      const { data } = await axios.get<
        any,
        AxiosResponse<SubscriptionResponse[]>,
        any
      >("/api/payments/subscribe");
      return data;
    },
  });

  const currPlan = useMemo(
    () =>
      subscriptions.reduce<Plan>((prev, curr) => {
        if (curr.status === "ACTIVE") return curr.plan;
        return prev;
      }, {} as Plan),
    [subscriptions]
  );

  const isExpired = useMemo(
    () => new Date(subscriptions[0]?.endDate || "") >= new Date(),
    [subscriptions]
  );

  return {
    plan: currPlan.name || "Start",
    isExpired,
    subscriptions,
  };
}

export default useVerifyPlan;
