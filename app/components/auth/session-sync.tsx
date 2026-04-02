"use client";

import { useEffect } from "react";
import { useAppStore, type AppUser } from "../../stores/app-store";

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