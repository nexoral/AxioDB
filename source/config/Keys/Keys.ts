export const General = {
  DBMS_Name : "AxioDB",
  DBMS_GUI_Enable : false,
  DBMS_File_EXT : ".axiodb",
  DocumentId_Length : 30, // Length of auto-generated alphanumeric document IDs
}

export enum WebServer {
  StaticServerPORT = 2025,
  ApiServerPORT = 2026,
  TCPServerPORT = 2027,
  WebSocketServerPORT = 2028,
  GraphQLServerPORT = 2029,
}
