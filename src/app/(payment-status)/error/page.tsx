"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

function FalhaPage() {
  const params = useSearchParams();
  const paymentId = params.get("payment_id");
  const status = params.get("status");
  const merchantOrderId = params.get("merchant_order_id");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-red-600 text-3xl font-bold mb-4">❌ Pagamento Falhou</h1>
      <p className="mb-2">Não foi possível processar seu pagamento.</p>
      <div className="bg-gray-100 p-4 rounded shadow-md">
        <p><strong>ID do Pagamento:</strong> {paymentId}</p>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Ordem:</strong> {merchantOrderId}</p>
      </div>
    </main>
  );
}

const PaymentErrorPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <FalhaPage />
    </Suspense>
  );
}

export default PaymentErrorPage;
