"use client";

import { useCallback, useEffect, useState } from "react";
import { devices, networks, vlans } from "@/lib/harisApi";

const TABS = [
  { id: "networks", label: "Networks", api: networks },
  { id: "vlans", label: "VLANs", api: vlans },
  { id: "devices", label: "Devices", api: devices },
];

const CREATE_DEFAULTS = {
  networks: { name: "Campus LAN", cidr: "192.168.0.0/16", description: "", is_active: true },
  vlans: { vlan_id: 20, name: "Students", network: 1, gateway_ip: "192.168.20.1", is_restricted: false },
  devices: {
    name: "Core Switch",
    ip_address: "192.168.1.2",
    mac_address: "00:11:22:33:44:55",
    device_type: "switch",
    status: "active",
  },
};

export default function InventoryPage() {
  const [tab, setTab] = useState("networks");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formJson, setFormJson] = useState(
    () => JSON.stringify(CREATE_DEFAULTS.networks, null, 2)
  );

  const activeApi = TABS.find((t) => t.id === tab)?.api ?? networks;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await activeApi.list();
      setRows(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inventory load failed.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeApi]);

  useEffect(() => {
    setFormJson(JSON.stringify(CREATE_DEFAULTS[tab] ?? {}, null, 2));
    load();
  }, [tab, load]);

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    try {
      const body = JSON.parse(formJson);
      await activeApi.create(body);
      setSuccess("Created successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await activeApi.remove(id);
      setSuccess("Deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0 space-y-6">
      <header className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Inventory</p>
        <h1 className="text-3xl font-bold text-foreground">Networks & assets</h1>
        <p className="text-sm text-muted">
          CRUD via inventory/networks, vlans, devices — haris_api_contract
        </p>
        {error ? <p className="text-xs text-primary">{error}</p> : null}
        {success ? <p className="text-xs text-accent">{success}</p> : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold ${
              tab === t.id
                ? "border-primary/35 bg-primary/12 text-primary"
                : "border-border text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Create ({tab})</h2>
        <textarea
          value={formJson}
          onChange={(e) => setFormJson(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-xl border border-border/90 bg-background/60 p-3 font-mono text-xs"
        />
        <button
          type="button"
          onClick={handleCreate}
          className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
        >
          POST create
        </button>
      </section>

      <section className="rounded-2xl border border-border/90 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/70 px-5 py-3 text-sm text-muted">
          {loading ? "Loading…" : `${rows.length} record(s)`}
        </div>
        {rows.length === 0 && !loading ? (
          <p className="p-8 text-center text-sm text-muted">No records from API.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/80 text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Summary</th>
                  <th className="px-5 py-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-primary/[0.03]">
                    <td className="px-5 py-3 font-mono text-xs">{row.id}</td>
                    <td className="px-5 py-3">
                      <pre className="text-xs text-muted whitespace-pre-wrap max-w-xl">
                        {JSON.stringify(row, null, 0).slice(0, 200)}
                        {JSON.stringify(row).length > 200 ? "…" : ""}
                      </pre>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="text-xs font-bold text-primary"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
