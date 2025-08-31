"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SucessoPage() {
  const params = useSearchParams();
  const paymentId = params.get("payment_id");
  const status = params.get("status");
  const merchantOrderId = params.get("merchant_order_id");

  return (
    <div className="flex justify-center items-center px-4 py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Pagamento aprovado!</CardTitle>
            <CircleCheck className="text-brand-teal" />
          </div>
        </CardHeader>
        <CardContent>
          <p><strong>ID do Pagamento:</strong> {paymentId}</p>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Ordem:</strong> {merchantOrderId}</p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant='link'>
            <Link href='/dashboard/profissional'>
              Voltar para dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

const PaymentSuccessPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SucessoPage />
    </Suspense>
  );
}

export default PaymentSuccessPage;
