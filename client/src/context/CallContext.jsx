/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-empty */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";
import { ChatContext } from "./ChatContext";
import { createPeerConnection, getLocalStream, stopStream } from "../lib/webrtc";
import { sid, idEq } from "../lib/utils";
import toast from "react-hot-toast";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket, authUser, onlineUser } = useContext(AuthContext);
  const { logCall, users } = useContext(ChatContext);

  const [callState, setCallState] = useState({
    status: "idle",
    kind: null,
    peer: null,
    localStream: null,
    remoteStream: null,
    muted: false,
    cameraOff: false,
    startedAt: null,
    connectionState: null,
    iceState: null,
  });

  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const incomingOfferRef = useRef(null);
  const callStateRef = useRef(callState);
  const usersRef = useRef(users);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const cleanup = useCallback(() => {
    try {
      if (pcRef.current) {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }
    } catch {}
    setCallState((prev) => {
      stopStream(prev.localStream);
      return {
        status: "idle",
        kind: null,
        peer: null,
        localStream: null,
        remoteStream: null,
        muted: false,
        cameraOff: false,
        startedAt: null,
        connectionState: null,
        iceState: null,
      };
    });
    pendingCandidatesRef.current = [];
    incomingOfferRef.current = null;
  }, []);

  const attachPcHandlers = useCallback(
    (pc) => {
      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        setCallState((prev) => ({ ...prev, connectionState: st }));
        if (st === "failed") {
          toast.error(
            "Call could not connect. Try same Wi‑Fi, disable VPN, and allow camera & microphone."
          );
          setTimeout(() => cleanup(), 1500);
        }
        if (st === "disconnected") {
          /* may recover; ICE may reconnect */
        }
      };
      pc.oniceconnectionstatechange = () => {
        setCallState((prev) => ({
          ...prev,
          iceState: pc.iceConnectionState,
        }));
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          /* failed is serious */
          if (pc.iceConnectionState === "failed") {
            toast.error("Network blocked the call (ICE failed). Try again on the same network.");
            setTimeout(() => cleanup(), 2000);
          }
        }
      };
    },
    [cleanup]
  );

  const startCall = useCallback(
    async (peer, kind = "audio") => {
      if (!socket || !peer) return;
      const peerId = sid(peer._id);

      if (!socket.connected) {
        toast.error(
          "You’re not connected to the server. Check your network and refresh the page.",
          { duration: 5000 }
        );
        return;
      }

      const peerOnline = (onlineUser || []).some((id) => idEq(id, peer._id));
      if (!peerOnline) {
        toast.error(
          "Can’t call — they’re not showing as online. They should keep QuickChat open in a browser (logged in) until you see the green dot, then try again.",
          { duration: 5000 }
        );
        return;
      }

      try {
        const stream = await getLocalStream({
          audio: true,
          video: kind === "video",
        });

        const pc = createPeerConnection({
          onIceCandidate: (candidate) =>
            socket.emit("call:ice", { to: peerId, candidate }),
          onTrack: (remoteStream) =>
            setCallState((prev) => ({ ...prev, remoteStream })),
        });
        attachPcHandlers(pc);

        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:invite", {
          to: peerId,
          kind,
          offer: { type: offer.type, sdp: offer.sdp },
          caller: {
            _id: sid(authUser._id),
            fullName: authUser.fullName,
            profilePic: authUser.profilePic,
          },
        });

        setCallState({
          status: "calling",
          kind,
          peer: { ...peer, _id: peerId },
          localStream: stream,
          remoteStream: null,
          muted: false,
          cameraOff: false,
          startedAt: null,
          connectionState: pc.connectionState,
          iceState: pc.iceConnectionState,
        });
      } catch (err) {
        console.error("startCall error", err);
        toast.error(
          err.name === "NotAllowedError"
            ? "Allow microphone and camera in the browser address bar."
            : err.name === "NotFoundError"
              ? "No camera/microphone found."
              : "Cannot start call. Check permissions and HTTPS/localhost."
        );
        cleanup();
      }
    },
    [socket, authUser, onlineUser, cleanup, attachPcHandlers]
  );

  const acceptCall = useCallback(async () => {
    if (!socket) return;
    const offer = incomingOfferRef.current;
    const { peer, kind } = callStateRef.current;
    if (!offer || !peer) return;

    const peerId = sid(peer._id);

    try {
      const stream = await getLocalStream({
        audio: true,
        video: kind === "video",
      });

      const pc = createPeerConnection({
        onIceCandidate: (candidate) =>
          socket.emit("call:ice", { to: peerId, candidate }),
        onTrack: (remoteStream) =>
          setCallState((prev) => ({ ...prev, remoteStream })),
      });
      attachPcHandlers(pc);

      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(
        new RTCSessionDescription({
          type: offer.type || "offer",
          sdp: offer.sdp,
        })
      );

      for (const c of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch {}
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", {
        to: peerId,
        answer: { type: answer.type, sdp: answer.sdp },
      });

      setCallState((prev) => ({
        ...prev,
        status: "active",
        localStream: stream,
        startedAt: Date.now(),
        connectionState: pc.connectionState,
        iceState: pc.iceConnectionState,
      }));
    } catch (err) {
      console.error("acceptCall error", err);
      toast.error("Could not accept call. Check camera/mic permissions.");
      socket.emit("call:reject", { to: peerId });
      cleanup();
    }
  }, [socket, cleanup, attachPcHandlers]);

  const rejectCall = useCallback(() => {
    if (!socket) return;
    const peer = callStateRef.current.peer;
    const kind = callStateRef.current.kind;
    if (peer) {
      socket.emit("call:reject", { to: sid(peer._id) });
      logCall({
        receiverId: sid(peer._id),
        kind,
        status: "rejected",
        duration: 0,
      });
    }
    cleanup();
  }, [socket, cleanup, logCall]);

  const endCall = useCallback(() => {
    if (!socket) return;
    const { peer, startedAt, status, kind } = callStateRef.current;
    if (peer) {
      const peerId = sid(peer._id);
      const duration = startedAt
        ? Math.floor((Date.now() - startedAt) / 1000)
        : 0;
      if (status === "calling") {
        socket.emit("call:cancel", { to: peerId });
        logCall({
          receiverId: peerId,
          kind,
          status: "missed",
          duration: 0,
        });
      } else {
        socket.emit("call:end", { to: peerId });
        if (status === "active" || startedAt) {
          logCall({
            receiverId: peerId,
            kind,
            status: "ended",
            duration,
          });
        }
      }
    }
    cleanup();
  }, [socket, cleanup, logCall]);

  const toggleMute = useCallback(() => {
    setCallState((prev) => {
      if (!prev.localStream) return prev;
      const enabled = prev.muted;
      prev.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
      return { ...prev, muted: !prev.muted };
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCallState((prev) => {
      if (!prev.localStream) return prev;
      const enabled = prev.cameraOff;
      prev.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
      return { ...prev, cameraOff: !prev.cameraOff };
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ from, kind, offer, caller }) => {
      if (callStateRef.current.status !== "idle") {
        socket.emit("call:reject", { to: sid(from) });
        return;
      }
      const fromId = sid(from);
      const peer =
        caller && caller._id
          ? { ...caller, _id: sid(caller._id) }
          : (() => {
              const u = usersRef.current.find((x) => sid(x._id) === fromId);
              return u || { _id: fromId, fullName: "Unknown" };
            })();

      incomingOfferRef.current = offer;
      setCallState({
        status: "incoming",
        kind,
        peer,
        localStream: null,
        remoteStream: null,
        muted: false,
        cameraOff: false,
        startedAt: null,
        connectionState: null,
        iceState: null,
      });
    };

    const handleAnswered = async ({ answer }) => {
      try {
        const pc = pcRef.current;
        if (!pc || !answer) return;
        await pc.setRemoteDescription(
          new RTCSessionDescription({
            type: answer.type || "answer",
            sdp: answer.sdp,
          })
        );
        for (const c of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch {}
        }
        pendingCandidatesRef.current = [];
        setCallState((prev) => ({
          ...prev,
          status: "active",
          startedAt: Date.now(),
          connectionState: pc.connectionState,
          iceState: pc.iceConnectionState,
        }));
      } catch (e) {
        console.error("answer err", e);
        toast.error("Could not complete the call handshake.");
        cleanup();
      }
    };

    const handleIce = async ({ candidate }) => {
      if (!candidate) return;
      try {
        const pc = pcRef.current;
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (e) {
        console.error("ice err", e);
      }
    };

    const handleRejected = () => {
      toast("Call declined", { icon: "📞" });
      const peer = callStateRef.current.peer;
      const kind = callStateRef.current.kind;
      if (peer) {
        logCall({
          receiverId: sid(peer._id),
          kind,
          status: "rejected",
          duration: 0,
        });
      }
      cleanup();
    };

    const handleEnded = () => {
      toast("Call ended", { icon: "📞" });
      cleanup();
    };

    const handleCancelled = () => {
      toast("Caller cancelled", { icon: "📞" });
      cleanup();
    };

    const handleUnavailable = () => {
      toast.error(
        "No answer — the other person isn’t connected to the server right now. They should open QuickChat (logged in) in a browser tab, wait for the chat list to load, then you can call again.",
        { duration: 6500 }
      );
      cleanup();
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:answered", handleAnswered);
    socket.on("call:ice", handleIce);
    socket.on("call:rejected", handleRejected);
    socket.on("call:ended", handleEnded);
    socket.on("call:cancelled", handleCancelled);
    socket.on("call:unavailable", handleUnavailable);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:answered", handleAnswered);
      socket.off("call:ice", handleIce);
      socket.off("call:rejected", handleRejected);
      socket.off("call:ended", handleEnded);
      socket.off("call:cancelled", handleCancelled);
      socket.off("call:unavailable", handleUnavailable);
    };
  }, [socket, cleanup, logCall]);

  const value = {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
