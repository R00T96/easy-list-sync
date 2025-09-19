import { useContext } from "react";
import { EventContext } from "../events/EventContext";

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used within an EventProvider");
  return ctx;
}