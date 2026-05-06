// STUN + public TURN relay (Open Relay) — helps calls work through NAT / many home routers.
// For production, use your own TURN (Twilio, coturn) and env-based credentials.
export const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

export const createPeerConnection = (handlers = {}) => {
  const pc = new RTCPeerConnection(RTC_CONFIG);

  pc.onicecandidate = (e) => {
    if (e.candidate && handlers.onIceCandidate) {
      handlers.onIceCandidate(e.candidate);
    }
  };

  pc.ontrack = (e) => {
    if (handlers.onTrack && e.streams[0]) {
      handlers.onTrack(e.streams[0]);
    }
  };

  pc.onconnectionstatechange = () => {
    if (handlers.onConnectionStateChange) {
      handlers.onConnectionStateChange(pc.connectionState);
    }
  };

  pc.oniceconnectionstatechange = () => {
    if (handlers.onIceConnectionStateChange) {
      handlers.onIceConnectionStateChange(pc.iceConnectionState);
    }
  };

  return pc;
};

export const getLocalStream = async ({ audio = true, video = false } = {}) => {
  return await navigator.mediaDevices.getUserMedia({
    audio: audio
      ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      : false,
    video: video
      ? {
          facingMode: { ideal: "user" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        }
      : false,
  });
};

export const stopStream = (stream) => {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
};
