import React, { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoCameraOutline, IoCheckmark } from "react-icons/io5";
import { FaPencilAlt } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import Avatar from "../components/Avatar";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [selectedImg, setSelectedImg] = useState(null);

  const [name, setName] = useState(authUser?.fullName || "");
  
  const [bio, setBio] = useState(authUser?.bio || "Hey there! I am using QuickChat.");
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {

    setSaving(true);
    try {
      if (!selectedImg) {
        await updateProfile({ fullName: name, bio });
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImg);
        await new Promise((resolve) => {
          reader.onload = async () => {
            await updateProfile({
              profilePic: reader.result,
              fullName: name,
              bio,
            });
            resolve();
          };
        });
      }
      navigate("/");
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = selectedImg
    ? URL.createObjectURL(selectedImg)
    : authUser?.profilePic;

  return (
    <div className="min-h-screen bg-[#0b141a] flex flex-col">
      {/* Header */}
      <div className="bg-[#202c33] flex items-center gap-6 px-6 py-4 border-b border-[#222d34]">
        <button
          onClick={() => navigate("/")}
          className="text-[#aebac1] hover:text-white p-1"
        >
          <IoArrowBack className="text-xl" />
        </button>
        <h1 className="text-white text-lg font-medium">Profile</h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-10 gap-2">
        {/* Avatar with camera */}
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <div className="w-44 h-44 rounded-full overflow-hidden">
            {previewSrc ? (
              <img src={previewSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <Avatar src={null} name={name} size={176} />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition">
            <IoCameraOutline className="text-white text-3xl" />
            <span className="text-white text-xs mt-1">CHANGE PROFILE PHOTO</span>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => setSelectedImg(e.target.files[0])}
        />

        <div className="w-full max-w-xl mt-6 space-y-1">
          {/* NAME */}
          <div className="bg-[#111b21] px-5 py-4 rounded-lg">
            <p className="text-xs text-[#00a884] mb-2">Your name</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-white border-b border-[#00a884] outline-none py-1"
                  autoFocus
                  maxLength={50}
                />
                <button
                  onClick={() => setEditingName(false)}
                  className="text-[#00a884] p-1"
                >
                  <IoCheckmark className="text-xl" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-white text-base">{name}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-[#aebac1] hover:text-white p-1"
                >
                  <FaPencilAlt />
                </button>
              </div>
            )}
            <p className="text-[11px] text-[#8696a0] mt-2">
              This is the name visible to your contacts.
            </p>
          </div>

          {/* EMAIL */}
          <div className="bg-[#111b21] px-5 py-4 rounded-lg">
            <p className="text-xs text-[#00a884] mb-1">Email</p>
            <p className="text-white text-sm">{authUser?.email}</p>
          </div>

          {/* BIO */}
          <div className="bg-[#111b21] px-5 py-4 rounded-lg">
            <p className="text-xs text-[#00a884] mb-2">About</p>
            {editingBio ? (
              <div className="flex items-start gap-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="flex-1 bg-transparent text-white border-b border-[#00a884] outline-none py-1 resize-none"
                  rows={2}
                  autoFocus
                  maxLength={140}
                />
                <button
                  onClick={() => setEditingBio(false)}
                  className="text-[#00a884] p-1"
                >
                  <IoCheckmark className="text-xl" />
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <p className="text-white text-base whitespace-pre-wrap">
                  {bio}
                </p>
                <button
                  onClick={() => setEditingBio(true)}
                  className="text-[#aebac1] hover:text-white p-1"
                >
                  <FaPencilAlt />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-8 bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-50
          text-white px-12 py-3 rounded-full font-medium transition shadow-lg"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
