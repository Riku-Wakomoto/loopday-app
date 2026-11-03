import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AgeStatus } from '../lib/age';

// In-memory app state for the scaffold. Replaced by Supabase-backed data
// (see supabase/migrations) in the next milestone.

export interface Profile {
  displayName: string;
  birthdate: string; // YYYY-MM-DD
  ageStatus: Exclude<AgeStatus, 'blocked'>;
  guardianConsent: boolean;
}

export interface Room {
  id: string;
  name: string;
  /** Maximum members including the creator. */
  capacity: number;
  members: string[];
}

export interface Message {
  id: string;
  author: string;
  text: string;
  sentAt: number;
  /** Emoji reactions by display name. */
  reactions: Record<string, string>;
}

interface AppState {
  profile: Profile | null;
  messages: Record<string, Message[]>;
  sendMessage: (roomId: string, text: string) => void;
  toggleReaction: (roomId: string, messageId: string, emoji: string) => void;
  draft: Partial<Profile>;
  rooms: Room[];
  updateDraft: (patch: Partial<Profile>) => void;
  completeOnboarding: () => void;
  createRoom: (name: string, capacity: number) => Room;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const me = profile?.displayName ?? draft.displayName ?? 'Me';

  const value = useMemo<AppState>(
    () => ({
      profile,
      draft,
      rooms,
      messages,
      sendMessage: (roomId, text) => {
        const message: Message = {
          id: Math.random().toString(36).slice(2, 10),
          author: me,
          text,
          sentAt: Date.now(),
          reactions: {},
        };
        setMessages((m) => ({ ...m, [roomId]: [...(m[roomId] ?? []), message] }));
      },
      toggleReaction: (roomId, messageId, emoji) => {
        setMessages((m) => ({
          ...m,
          [roomId]: (m[roomId] ?? []).map((msg) => {
            if (msg.id !== messageId) return msg;
            const reactions = { ...msg.reactions };
            if (reactions[me] === emoji) delete reactions[me];
            else reactions[me] = emoji;
            return { ...msg, reactions };
          }),
        }));
      },
      updateDraft: (patch) => setDraft((d) => ({ ...d, ...patch })),
      completeOnboarding: () => {
        if (!draft.displayName || !draft.birthdate || !draft.ageStatus) return;
        setProfile({
          displayName: draft.displayName,
          birthdate: draft.birthdate,
          ageStatus: draft.ageStatus,
          guardianConsent: draft.guardianConsent ?? false,
        });
      },
      createRoom: (name, capacity) => {
        const room: Room = {
          id: Math.random().toString(36).slice(2, 10),
          name,
          capacity,
          members: [me],
        };
        setRooms((r) => [room, ...r]);
        return room;
      },
    }),
    [profile, draft, rooms, messages, me],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
