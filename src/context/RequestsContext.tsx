import React, { createContext, useContext, useEffect, useState } from 'react';
import { LeadRequest } from '../types';
import { triggerHaptic } from '../utils/formatters';
import { supabase } from '../services/supabaseClient';

interface RequestsContextType {
  requests: LeadRequest[];
  addRequest: (newReq: Omit<LeadRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateRequestStatus: (id: string, status: LeadRequest['status']) => Promise<void>;
}

const RequestsContext = createContext<RequestsContextType>({
  requests: [],
  addRequest: async () => {},
  updateRequestStatus: async () => {},
});

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<LeadRequest[]>(() => {
    try {
      const saved = localStorage.getItem('comet_requests');
      if (!saved) return [];
      const parsed: LeadRequest[] = JSON.parse(saved);
      return parsed.filter((r) => r.id !== 'REQ-1001' && r.id !== 'REQ-1002');
    } catch {
      return [];
    }
  });

  // Fetch requests from Supabase on mount
  useEffect(() => {
    const fetchSupabaseRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('lead_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase fetch notice (table may be freshly created):', error.message);
          return;
        }

        if (data && data.length > 0) {
          const mapped: LeadRequest[] = data.map((item) => ({
            id: item.id,
            customerName: item.customer_name,
            phoneNumber: item.phone_number,
            telegramUsername: item.telegram_username,
            productId: item.product_id,
            productName: item.product_name,
            productPrice: item.product_price ? Number(item.product_price) : undefined,
            productImage: item.product_image,
            notes: item.notes,
            status: item.status,
            createdAt: item.created_at,
          }));
          setRequests(mapped);
        }
      } catch (e) {
        console.error('Error syncing with Supabase:', e);
      }
    };

    fetchSupabaseRequests();
  }, []);

  // Sync to local storage for offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('comet_requests', JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save requests', e);
    }
  }, [requests]);

  const addRequest = async (newReqData: Omit<LeadRequest, 'id' | 'createdAt' | 'status'>) => {
    const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const created: LeadRequest = {
      ...newReqData,
      id: newId,
      status: 'new',
      createdAt: nowIso,
    };

    triggerHaptic('success');
    setRequests((prev) => [created, ...prev]);

    // Save to Supabase DB asynchronously
    try {
      await supabase.from('lead_requests').insert([
        {
          id: newId,
          customer_name: newReqData.customerName,
          phone_number: newReqData.phoneNumber,
          telegram_username: newReqData.telegramUsername,
          product_id: newReqData.productId,
          product_name: newReqData.productName,
          product_price: newReqData.productPrice,
          product_image: newReqData.productImage,
          notes: newReqData.notes,
          status: 'new',
          created_at: nowIso,
        },
      ]);
    } catch (err) {
      console.error('Failed to insert request into Supabase:', err);
    }
  };

  const updateRequestStatus = async (id: string, status: LeadRequest['status']) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    // Update in Supabase DB
    try {
      await supabase
        .from('lead_requests')
        .update({ status })
        .eq('id', id);
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
    }
  };

  return (
    <RequestsContext.Provider value={{ requests, addRequest, updateRequestStatus }}>
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => useContext(RequestsContext);
