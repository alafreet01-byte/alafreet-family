"use client";

import { useSyncExternalStore } from "react";

import { demoCoreState } from "./demo-data";
import type {
  CoreEvent,
  CoreState,
  Reminder,
} from "./types";

let state: CoreState = structuredClone(demoCoreState);
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function useFamilyCore() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
}

export function addReminder(
  reminder: Omit<Reminder, "id" | "status">,
) {
  const nextReminder: Reminder = {
    ...reminder,
    id: createId("rem"),
    status: "open",
  };

  const event: CoreEvent = {
    id: createId("evt"),
    type: "reminder.created",
    title: "تذكير جديد",
    detail: nextReminder.title,
    createdAt: new Date().toISOString(),
    actorId: nextReminder.createdBy,
    targetId: nextReminder.ownerId,
  };

  state = {
    ...state,
    reminders: [nextReminder, ...state.reminders],
    events: [event, ...state.events],
  };

  emitChange();
}

export function toggleReminder(reminderId: string) {
  state = {
    ...state,
    reminders: state.reminders.map((reminder) =>
      reminder.id === reminderId
        ? {
            ...reminder,
            status:
              reminder.status === "open" ? "done" : "open",
          }
        : reminder,
    ),
  };

  emitChange();
}

export function resetCoreDemo() {
  state = structuredClone(demoCoreState);
  emitChange();
}
