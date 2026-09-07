'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Challenge {
    id: string;
    title: string;
    description: string;
    category: string;
    points: number;
    isActive: boolean;
}

const CATEGORIES = [
    'WEB',
    'CRYPTO',
    'FORENSICS',
    'REVERSE_ENGINEERING',
    'MISC',
    'PWN',
];

const emptyForm = {
    title: '',
    description: '',
    category: 'MISC',
    points: 100,
    flag: '',
};

export default function AdminChallengesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadChallenges = async () => {
        const res = await fetch('/api/admin/challenges');
        if (res.ok) {
            setChallenges(await res.json());
        }
        setLoadingList(false);
    };

    useEffect(() => {
        if (!authLoading && (!user || !user.isAdmin)) {
            router.push('/dashboard');
            return;
        }
        if (user?.isAdmin) loadChallenges();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const url = editingId
            ? `/api/admin/challenges/${editingId}`
            : '/api/admin/challenges';
        const method = editingId ? 'PATCH' : 'POST';

        // On edit, only send flag if the admin actually typed a new one
        const payload =
            editingId && !form.flag
                ? { ...form, flag: undefined }
                : form;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        setSubmitting(false);

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.message || 'Failed to save challenge');
            return;
        }

        resetForm();
        await loadChallenges();
    };

    const handleEdit = (c: Challenge) => {
        setEditingId(c.id);
        setForm({
            title: c.title,
            description: c.description,
            category: c.category,
            points: c.points,
            flag: '', // never pre-filled — flags are never returned by the API
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this challenge? This cannot be undone.')) return;

        await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' });
        await loadChallenges();
    };

    const handleToggleActive = async (c: Challenge) => {
        await fetch(`/api/admin/challenges/${c.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !c.isActive }),
        });
        await loadChallenges();
    };

    if (authLoading || loadingList) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-8 text-2xl font-bold">Manage Challenges</h1>

                {error && (
                    <div className="mb-4 rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mb-8 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
                >
                    <p className="font-medium">
                        {editingId ? 'Edit challenge' : 'Create a new challenge'}
                    </p>

                    <input
                        type="text"
                        required
                        placeholder="Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
                    />

                    <textarea
                        required
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                        rows={3}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
                    />

                    <div className="flex gap-3">
                        <select
                            value={form.category}
                            onChange={(e) =>
                                setForm({ ...form, category: e.target.value })
                            }
                            className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c.replace('_', ' ')}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            required
                            min={1}
                            placeholder="Points"
                            value={form.points}
                            onChange={(e) =>
                                setForm({ ...form, points: Number(e.target.value) })
                            }
                            className="w-32 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
                        />
                    </div>

                    <input
                        type="text"
                        required={!editingId}
                        placeholder={
                            editingId
                                ? 'New flag (leave blank to keep current)'
                                : 'Flag (e.g. LUCY{...})'
                        }
                        value={form.flag}
                        onChange={(e) => setForm({ ...form, flag: e.target.value })}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-white outline-none focus:border-emerald-600"
                    />

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {editingId ? 'Save changes' : 'Create challenge'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-md border border-neutral-700 px-4 py-2 text-neutral-300 hover:bg-neutral-800"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="space-y-3">
                    {challenges.map((c) => (
                        <div
                            key={c.id}
                            className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                        >
                            <div>
                                <p className="font-medium">
                                    {c.title}{' '}
                                    <span className="ml-2 text-xs text-neutral-500">
                                        {c.category} · {c.points}pts
                                    </span>
                                    {!c.isActive && (
                                        <span className="ml-2 rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                                            Inactive
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleToggleActive(c)}
                                    className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
                                >
                                    {c.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => handleEdit(c)}
                                    className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}