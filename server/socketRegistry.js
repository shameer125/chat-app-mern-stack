/** Breaks circular imports: controllers emit without importing server.js before io exists. */

let ioRef = null;
let userSocketMapRef = null;

export const normIdSock = (id) => (id == null ? "" : String(id));

export function initSocketRegistry(ioInstance, userSocketMap) {
  ioRef = ioInstance;
  userSocketMapRef = userSocketMap;
}


export function getIO() {
  return ioRef;
}


export function getUserSocketMap() {
  return userSocketMapRef;
}

export function emitToUserSocket(userId, event, payload) {
  if (!ioRef || !userSocketMapRef) return;
  const sk = userSocketMapRef[normIdSock(userId)];
  if (sk) ioRef.to(sk).emit(event, payload);
}

/** group: doc or plain object with members: [{ user: ObjectId|{ _id } }] */
export function emitToGroupMembers(
  group,
  event,
  payload,
  exceptUserId = null
) {
  if (!ioRef || !userSocketMapRef) return;
  const ex = exceptUserId != null ? normIdSock(exceptUserId) : null;
  for (const m of group.members || []) {
    const uid = normIdSock(m.user?._id ?? m.user);
    if (ex && uid === ex) continue;
    const sk = userSocketMapRef[uid];
    if (sk) ioRef.to(sk).emit(event, payload);
  }
}
