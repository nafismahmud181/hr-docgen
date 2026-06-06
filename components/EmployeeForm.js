"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const OTHER = "__other__";

export default function EmployeeForm({ employee, departments = [] }) {
  const router = useRouter();
  const editing = Boolean(employee);
  const [form, setForm] = useState({ ...EMPTY, ...(employee || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const deptNames = departments.map((d) => d.name);
  const selectedDept = departments.find((d) => d.name === form.department);
  const roleOptions = selectedDept ? selectedDept.roles.map((r) => r.name) : [];

  // Free-text mode is needed when the saved value isn't in the managed lists
  // (e.g. legacy data), or when the user explicitly picks "Other…".
  const initialDeptCustom = Boolean(form.department) && !deptNames.includes(form.department);
  const [deptCustom, setDeptCustom] = useState(initialDeptCustom);
  const [roleCustom, setRoleCustom] = useState(
    initialDeptCustom || (Boolean(form.designation) && !roleOptions.includes(form.designation))
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function chooseDept(e) {
    const v = e.target.value;
    if (v === OTHER) {
      setDeptCustom(true);
      setRoleCustom(true); // a custom department has no managed roles
      setForm((f) => ({ ...f, department: "", designation: "" }));
      return;
    }
    // Department changed → roles differ, so reset the designation.
    setDeptCustom(false);
    setRoleCustom(false);
    setForm((f) => ({ ...f, department: v, designation: "" }));
  }

  function backToDeptList() {
    setDeptCustom(false);
    setRoleCustom(false);
    setForm((f) => ({ ...f, department: "", designation: "" }));
  }

  function chooseRole(e) {
    const v = e.target.value;
    if (v === OTHER) {
      setRoleCustom(true);
      setForm((f) => ({ ...f, designation: "" }));
      return;
    }
    setForm((f) => ({ ...f, designation: v }));
  }

  function backToRoleList() {
    setRoleCustom(false);
    setForm((f) => ({ ...f, designation: "" }));
  }

  const designationAsText = deptCustom || roleCustom;
  const noRolesForDept = !deptCustom && form.department && roleOptions.length === 0;

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
          <label>Department</label>
          {deptCustom ? (
            <>
              <input value={form.department} onChange={set("department")} placeholder="e.g. Engineering" />
              {departments.length > 0 && (
                <button type="button" className="btn-link field-link" onClick={backToDeptList}>
                  ↩ Choose from list
                </button>
              )}
            </>
          ) : (
            <select value={form.department} onChange={chooseDept}>
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
              <option value={OTHER}>Other…</option>
            </select>
          )}
        </div>

        <div className="field">
          <label>Designation *</label>
          {designationAsText ? (
            <>
              <input value={form.designation} onChange={set("designation")} placeholder="e.g. Software Engineer" />
              {!deptCustom && (
                <button type="button" className="btn-link field-link" onClick={backToRoleList}>
                  ↩ Choose from list
                </button>
              )}
            </>
          ) : (
            <select value={form.designation} onChange={chooseRole}>
              <option value="">{form.department ? "Select role…" : "Select a department first…"}</option>
              {roleOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={OTHER}>Other…</option>
            </select>
          )}
          {noRolesForDept && (
            <span className="hint">
              No roles defined for {form.department}. Pick “Other…” to type one, or add roles in{" "}
              <Link href="/settings">Departments &amp; Roles</Link>.
            </span>
          )}
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
