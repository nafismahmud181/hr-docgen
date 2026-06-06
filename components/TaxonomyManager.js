"use client";

import { useState } from "react";

const byName = (a, b) => a.name.localeCompare(b.name);

function DepartmentCard({ dept, onAddRole, onRemoveRole, onDeleteDept }) {
  const [roleName, setRoleName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e) {
    e.preventDefault();
    const clean = roleName.trim();
    if (!clean) return;
    setBusy(true);
    setError("");
    const err = await onAddRole(dept.id, clean);
    if (err) setError(err);
    else setRoleName("");
    setBusy(false);
  }

  return (
    <section className="card dept-card">
      <div className="card-head">
        <h2 className="card-title">
          {dept.name} <span className="count-pill">{dept.roles.length}</span>
        </h2>
        <button type="button" className="tax-remove" title={`Delete ${dept.name}`} onClick={() => onDeleteDept(dept)}>
          ×
        </button>
      </div>

      {dept.roles.length === 0 ? (
        <p className="muted">No roles yet — add one below.</p>
      ) : (
        <ul className="tax-list">
          {dept.roles.map((r) => (
            <li key={r.id} className="tax-row">
              <span className="tax-name">{r.name}</span>
              <button
                type="button"
                className="tax-remove"
                title={`Delete ${r.name}`}
                onClick={() => onRemoveRole(dept.id, r)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="add-row add-row-sm" onSubmit={add}>
        <input
          className="add-input"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="Add a role…"
        />
        <button type="submit" className="btn btn-ghost" disabled={busy || !roleName.trim()}>
          {busy ? "Adding…" : "Add role"}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
    </section>
  );
}

export default function TaxonomyManager({ departments: initial }) {
  const [departments, setDepartments] = useState(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addDepartment(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add department.");
      setDepartments((list) => [...list, { ...data, roles: data.roles || [] }].sort(byName));
      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDepartment(dept) {
    if (!confirm(`Delete department "${dept.name}" and its ${dept.roles.length} role(s)?`)) return;
    const prev = departments;
    setDepartments((list) => list.filter((d) => d.id !== dept.id)); // optimistic
    const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDepartments(prev);
      setError(`Could not delete "${dept.name}".`);
    }
  }

  // Returns an error string on failure, or null on success.
  async function addRole(deptId, roleName) {
    const res = await fetch(`/api/departments/${deptId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: roleName }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Could not add role.";
    setDepartments((list) =>
      list.map((d) => (d.id === deptId ? { ...d, roles: [...d.roles, data].sort(byName) } : d))
    );
    return null;
  }

  async function removeRole(deptId, role) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    const prev = departments;
    setDepartments((list) =>
      list.map((d) => (d.id === deptId ? { ...d, roles: d.roles.filter((r) => r.id !== role.id) } : d))
    );
    const res = await fetch(`/api/departments/${deptId}/roles/${role.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDepartments(prev);
      setError(`Could not delete "${role.name}".`);
    }
  }

  return (
    <>
      <form className="add-row" onSubmit={addDepartment}>
        <input
          className="add-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a department…"
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? "Adding…" : "Add department"}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {departments.length === 0 ? (
        <p className="muted" style={{ marginTop: 18 }}>No departments yet. Add one above to start adding roles under it.</p>
      ) : (
        <div className="dept-grid">
          {departments.map((d) => (
            <DepartmentCard
              key={d.id}
              dept={d}
              onAddRole={addRole}
              onRemoveRole={removeRole}
              onDeleteDept={deleteDepartment}
            />
          ))}
        </div>
      )}
    </>
  );
}
