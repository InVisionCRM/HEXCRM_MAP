"use client";

import { useEffect, useState } from "react";
import { User, Phone, Mail, Bitcoin, Twitter, MessageCircle, MapPin, FileText, Calendar } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { customerStorage } from "@/lib/customer-storage";
import type { Customer } from "@/lib/types";

export default function OnboardsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const allCustomers = await customerStorage.getAllCustomers();
        setCustomers(allCustomers);
      } catch (err) {
        console.error('Error loading customers:', err);
        setError('Failed to load customers');
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Customer Onboards</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Customer Onboards</h1>
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Customer Onboards</h1>
        <div className="text-center text-muted-foreground">
          <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No customers found</p>
          <p className="text-sm">Start by onboarding your first customer!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Customer Onboards</h1>
      <p className="text-center text-muted-foreground mb-8">
        Manage and view all your onboarded customers
      </p>
      
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </ul>
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
}

const CustomerCard = ({ customer }: CustomerCardProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getCustomerIcon = (customer: Customer) => {
    if (customer.ownsCrypto) return <Bitcoin className="h-4 w-4 text-orange-500" />;
    if (customer.email) return <Mail className="h-4 w-4 text-blue-500" />;
    if (customer.phone) return <Phone className="h-4 w-4 text-green-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getSocialLinks = (customer: Customer) => {
    const socials = [];
    if (customer.socials?.twitter) {
      socials.push(
        <Twitter key="twitter" className="h-3 w-3 text-blue-400" title="Twitter" />
      );
    }
    if (customer.socials?.telegram) {
      socials.push(
        <MessageCircle key="telegram" className="h-3 w-3 text-blue-500" title="Telegram" />
      );
    }
    if (customer.socials?.reddit) {
      socials.push(
        <div key="reddit" className="h-3 w-3 bg-orange-500 rounded-full" title="Reddit" />
      );
    }
    return socials;
  };

  return (
    <li className="min-h-[18rem] list-none">
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl p-4 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="w-fit rounded-lg border border-gray-600 p-2">
                {getCustomerIcon(customer)}
              </div>
              <div className="flex gap-1">
                {getSocialLinks(customer)}
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-3 flex-1">
              <h3 className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                {customer.firstName}
              </h3>
              
              <div className="space-y-2">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                )}
                
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{customer.address}</span>
                </div>

                {customer.ownsCrypto && (
                  <div className="flex items-center gap-2 text-xs">
                    <Bitcoin className="h-3 w-3 text-orange-500" />
                    <span className="text-orange-500 font-medium">Crypto Owner</span>
                  </div>
                )}

                {customer.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs line-clamp-2">{customer.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}; 