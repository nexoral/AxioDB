import { FastifyReply } from "fastify";
import { StatusCodes } from "outers";
import { RequestBody } from "../config/Interfaces/RequestInterface";
import { ClassBased } from "outers";
import { CentralInformation } from "../config/Keys";

export default async function validateToken(
  request: RequestBody,
  reply: FastifyReply,
) {
  // Get Token from the request headers
  const authToken: string = request.headers["servicetoken"] as string;

  // Check if the token is valid
  if (!authToken) {
    return reply.status(StatusCodes.UNAUTHORIZED).send({
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      error: "Unauthorized user",
      message:
        "No service token provided, please provide servicetoken in the header",
    });
  }
  // Decode the token
  const decodedToken = new ClassBased.JWT_Manager(
    CentralInformation.CentralDB_JWT_Secret,
  ).decode(authToken);

  // Check if the token is valid or expired
  if (decodedToken.status === "Invalid") {
    return reply.status(StatusCodes.UNAUTHORIZED).send({
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }

  // Set the user data in the request body
  request.body = {
    ...request.body,
    user: decodedToken.data.data,
  };
}
