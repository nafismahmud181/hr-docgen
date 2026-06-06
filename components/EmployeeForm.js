"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMPTY = {
  name: "",
  gender: "female",
  employeeCode: "",
  designation: "",
  department: "",
  employmentType: "Permanent, full-time",
  joiningDate: "",
  lastWorkingDate: "",
  salary: "",
  email: "",
  phone: "",
  address: "",
};

export default function EmployeeForm({ employee }) {
  const router = useRouter();
  const editing = Boolean(employee);
  const [form, setForm] = useState({ ...EMPTY, ...(employee || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    setError("");
    if (!form.name.trim() || !form.designation.trim()) {
      setError("Name and designation are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/employees/${employee.id}` : "/api/employees",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      router.push(`/employees/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <h2>{editing ? "Edit employee" : "New employee"}</h2>
      <div className="form-grid">
        <div className="field">
          <label>Full name *</label>
          <input value={form.name} onChange={set("name")} placeholder="e.g. Farhana Rahman" />
        </div>
        <div className="field">
          <label>Gender</label>
          <select value={form.gender} onChange={set("gender")}>
            <option value="female">Female (Ms. / she)</option>
            <option value="male">Male (Mr. / he)</option>
            <option value="other">Other / unspecified (they)</option>
          </select>
        </div>
        <div className="field">
          <label>Employee ID</label>
          <input value={form.employeeCode} onChange={set("employeeCode")} placeholder="e.g. IW-0042" />
        </div>
        <div className="field">
          <label>Designation *</label>
          <input value={form.designation} onChange={set("designation")} placeholder="e.g. Software Engineer" />
        </div>
        <div className="field">
          <label>Department</label>
          <input value={form.department} onChange={set("department")} placeholder="e.g. Engineering" />
        </div>
        <div className="field">
          <label>Employment type</label>
          <select value={form.employmentType} onChange={set("employmentType")}>
            <option>Permanent, full-time</option>
            <option>Contractual</option>
            <option>Part-time</option>
            <option>Intern</option>
          </select>
        </div>
        <div className="field">
          <label>Joining date</label>
          <input type="date" value={form.joiningDate} onChange={set("joiningDate")} />
        </div>
        <div className="field">
          <label>Last working date</label>
          <input type="date" value={form.lastWorkingDate} onChange={set("lastWorkingDate")} />
          <span className="hint">Only needed for Experience Letters</span>
        </div>
        <div className="field">
          <label>Monthly gross salary (BDT)</label>
          <input value={form.salary} onChange={set("salary")} placeholder="e.g. 65000" />
          <span className="hint">Used in LOE and Salary Certificate</span>
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set("email")} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={set("phone")} />
        </div>
        <div className="field full">
          <label>Address</label>
          <input value={form.address} onChange={set("address")} />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add employee"}
        </button>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </div>
  );
}
