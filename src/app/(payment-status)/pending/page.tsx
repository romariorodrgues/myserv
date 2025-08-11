"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PendentePage() {
  const params = useSearchParams();
  const paymentId = params.get("payment_id");
  const status = params.get("status");
  const merchantOrderId = params.get("merchant_order_id");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-yellow-500 text-3xl font-bold mb-4">⏳ Pagamento Pendente</h1>
      <p className="mb-2">Estamos aguardando a confirmação do seu pagamento.</p>
      <div className="bg-gray-100 p-4 rounded shadow-md">
        <p><strong>ID do Pagamento:</strong> {paymentId}</p>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Ordem:</strong> {merchantOrderId}</p>
      </div>
    </main>
  );
}

const PaymentPendingPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PendentePage />
    </Suspense>
  );
}

export default PaymentPendingPage;
