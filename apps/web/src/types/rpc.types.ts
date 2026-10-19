export interface RpcProxySocket {
  target: string;
  origin: string | null;
  pending: (string | Uint8Array<ArrayBuffer>)[];
  upstream?: WebSocket;
}
