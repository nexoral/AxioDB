import generateSchema from "../util/SchemaGenerator.util";

export enum ServerPorts {
  HTTP = 27018,
  TCP = 27019,
  GRPC = 27020,
  WEBSOCKET = 27021,
  UDP = 27022,
}

// CentralDB Information
export const CentralDB_Auth_UserCollection_Schema = {
  name: ["string", "required"],
  email: [
    "string",
    "required",
    "pattern:^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
  ],
  username: ["string", "required", "pattern:^[a-zA-Z0-9_]{3,16}$"],
  role: ["string", "required"],
  updatedAt: ["number", "optional"],
  lastLogin: ["number", "optional"],
  isActive: ["boolean", "optional"],
  password: ["string", "required"],
  AccessToken: ["string", "optional"],
};

export const CentralInformation = {
  CentralDB_InstanceName: "AxioDB_Central_Information",
  CentralDB_Name: "AxioDB_Central_DB",
  CentralDB_JWT_Secret: "AxioDB_Central_Secret",
  CentralDB_Collection_Auth: "AxioDB_Central_Collection_Auth",
  CentralDB_Auth_UserCollection_Schema: generateSchema(
    CentralDB_Auth_UserCollection_Schema,
  ),
};
