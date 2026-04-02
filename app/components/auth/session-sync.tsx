"use client";

import { useAppStore } from "../../stores/app-store";
import { useEffect } from "react";

type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type Props = {
  user: AppUser;
};

export function SessionSync({ user }: Props) {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return null;
}