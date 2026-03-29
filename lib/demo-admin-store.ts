export type DemoAnnouncement = {
    id: string;
    type: string;
    title: string;
    desc: string;
    date: string;
    highlight?: boolean;
};

export type DemoBroadcast = {
    id: string;
    audience: string;
    text: string;
    createdAt: string;
};

const ANNOUNCEMENTS_KEY = "aqbobek_admin_announcements";
const BROADCASTS_KEY = "aqbobek_admin_broadcasts";
const SYNC_EVENT = "aqbobek-admin-sync";

function readJson<T>(key: string): T[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as T[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeJson<T>(key: string, value: T[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(SYNC_EVENT));
}

export function readAnnouncements() {
    return readJson<DemoAnnouncement>(ANNOUNCEMENTS_KEY);
}

export function saveAnnouncement(item: DemoAnnouncement) {
    const current = readAnnouncements();
    writeJson(ANNOUNCEMENTS_KEY, [item, ...current].slice(0, 20));
}

export function readBroadcasts() {
    return readJson<DemoBroadcast>(BROADCASTS_KEY);
}

export function saveBroadcast(item: DemoBroadcast) {
    const current = readBroadcasts();
    writeJson(BROADCASTS_KEY, [item, ...current].slice(0, 20));
}

export function subscribeAdminSync(callback: () => void) {
    if (typeof window === "undefined") return () => undefined;

    const handler = () => callback();
    window.addEventListener("storage", handler);
    window.addEventListener(SYNC_EVENT, handler);

    return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(SYNC_EVENT, handler);
    };
}
