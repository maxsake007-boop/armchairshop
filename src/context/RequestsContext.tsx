import React, { createContext, useContext, useEffect, useState } from 'react';
import { LeadRequest } from '../types';
import { triggerHaptic } from '../utils/formatters';

interface RequestsContextType {
  requests: LeadRequest[];
  addRequest: (newReq: Omit<LeadRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateRequestStatus: (id: string, status: LeadRequest['status']) => void;
}

const RequestsContext = createContext<RequestsContextType>({
  requests: [],
  addRequest: () => {},
  updateRequestStatus: () => {},
});

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<LeadRequest[]>(() => {
    try {
      const saved = localStorage.getItem('comet_requests');
      if (!saved) return [];
      const parsed: LeadRequest[] = JSON.parse(saved);
      // Filter out any legacy dummy requests
      return parsed.filter(r => r.id !== 'REQ-1001' && r.id !== 'REQ-1002');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('comet_requests', JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save requests', e);
    }
  }, [requests]);

  const addRequest = (newReqData: Omit<LeadRequest, 'id' | 'createdAt' | 'status'>) => {
    const created: LeadRequest = {
      ...newReqData,
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    triggerHaptic('success');
    setRequests((prev) => [created, ...prev]);
  };

  const updateRequestStatus = (id: string, status: LeadRequest['status']) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  return (
    <RequestsContext.Provider value={{ requests, addRequest, updateRequestStatus }}>
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => useContext(RequestsContext);
