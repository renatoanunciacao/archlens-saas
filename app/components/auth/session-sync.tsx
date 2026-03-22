"use client";

import { useAppStore } from "../../stores/app-store";
import { useEffect } from "react";

type Props = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export function SessionSync({ user }: Props) {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return null;
}