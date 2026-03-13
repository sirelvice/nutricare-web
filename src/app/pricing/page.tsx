"use client";

import React from "react";

export default function Pricing() {
  const handleCheckout = async (tier: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) throw new Error("Failed to create checkout session");

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert("Error creating checkout session. Try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-20 px-6 text-center">
      <h1 className="text-4xl font-semibold">Pricing</h1>

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div className="premium-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p className="mt-4">$29/month</p>
          <button
            onClick={() => handleCheckout("PRO")}
            className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-white"
          >
            Upgrade
          </button>
        </div>

        <div className="premium-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold">Clinic</h2>
          <p className="mt-4">$149/month</p>
          <button
            onClick={() => handleCheckout("CLINIC")}
            className="mt-6 rounded-xl bg-black px-6 py-3 text-white"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
