import React, { useContext, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import { sid, idEq } from "../lib/utils";

export default function NewGroupModal({ open, onClose }) {
  const { authUser } = useContext(AuthContext);
  const { users, getUsers, openGroup } = useContext(ChatContext);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  const others = useMemo(
    () => users.filter((u) => !idEq(u._id, authUser?._id)),
    [users, authUser]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return others;
    return others.filter((u) => u.fullName?.toLowerCase().includes(q));
  }, [others, query]);

  if (!open) return null;

  const toggle = (id) => {
    const k = sid(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Enter a group name");
      return;
    }
    if (selected.size < 1) {
      toast.error("Pick at least one contact");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/groups", {
        name: name.trim(),
        memberIds: [...selected],
      });
      if (!data.success) {
        toast.error(data.message || "Could not create group");
        return;
      }
      toast.success("Group created");
      await getUsers();
      if (data.group) openGroup(data.group);
      setName("");
      setQuery("");
      setSelected(new Set());
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center
       bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="New group"
    >
      <div className="w-full max-w-md rounded-xl bg-[#111b21] border border-[#374045]
       shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b
         border-[#222d34]">
          <h2 className="text-[#e9edef] font-medium">New group</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#aebac1] hover:bg-[#202c33]"
            aria-label="Close"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="text-xs text-[#8696a0] block mb-1">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend plans"
              className="w-full rounded-lg bg-[#202c33] border border-[#374045] px-3 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0]"
            />
          </div>

          <div>
            <label className="text-xs text-[#8696a0] block mb-1">
              Add members ({selected.size} selected)
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts"
              className="w-full rounded-lg bg-[#202c33] border border-[#374045] px-3 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] mb-2"
            />
            <div className="max-h-52 overflow-y-auto rounded-lg border border-[#222d34] divide-y divide-[#222d34]">
              {filtered.length === 0 ? (
                <p className="text-sm text-[#8696a0] p-3">No contacts</p>
              ) : (
                filtered.map((u) => {
                  const uid = sid(u._id);
                  const on = selected.has(uid);
                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={() => toggle(u._id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#202c33] ${
                        on ? "bg-[#2a3942]/80" : ""
                      }`}
                    >
                      <Avatar src={u.profilePic} name={u.fullName} size={40} />
                      <span className="text-sm text-[#e9edef] truncate flex-1">
                        {u.fullName}
                      </span>
                      <span
                        className={`text-xs w-5 h-5 rounded border flex items-center justify-center ${
                          on
                            ? "bg-[#00a884] border-[#00a884] text-white"
                            : "border-[#8696a0] text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#222d34] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-[#aebac1] hover:bg-[#202c33]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleCreate}
            className="px-5 py-2 text-sm rounded-lg bg-[#00a884] text-[#111b21] font-medium hover:bg-[#06cf9c] disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}
