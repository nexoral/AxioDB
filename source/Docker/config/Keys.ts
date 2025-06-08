import generateSchema from "../util/SchemaGenerator.util";

export enum ServerPorts {
  HTTP = 27018,
  TCP = 27019,
  GRPC = 27020,
  WEBSOCKET = 27021,
  UDP = 27022,
}

export const CentralDB_Auth_UserCollection_Schema = {
  name: ["required"],
  email: ["required"],
  username: ["required"],
  password: ["required"],
  AccessToken: ["optional"],
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
