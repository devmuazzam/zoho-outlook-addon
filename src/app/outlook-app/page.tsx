"use client";

import { useEffect } from "react";

export default function OutlookPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  return null;
}
