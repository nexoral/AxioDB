/* eslint-disable @typescript-eslint/no-explicit-any */
import Collection from "axiodb/lib/Operation/Collection/collection.operation";
import { StatusCodes } from "outers";
import bcrypt from "../../Helper/bcrypt.helper";
import { ClassBased } from "outers";
import {
  CentralDB_Auth_UserCollection_Schema,
  CentralInformation,
} from "../../config/Keys";
import validateSchema from "../../Helper/schemaValidator.helper";
// Interfaces
interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  name: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

// Authentication Class to handle all the authentication related operations
export default class Authentication {
  // Method to handle user registration management
  public static async Register(
    userData: RegisterRequest,
    CollectionInstance: Collection,
  ) {
    try {
      // check if all fields are filled
      for (const key in userData) {
        if (!userData[key as keyof RegisterRequest]) {
          throw new Error(`${key} is required`);
        }
      }
      const { email, username } = userData; // Destructure the userData object
      // check if username already exists
      const existingUser = await CollectionInstance.query({
        $or: [{ email: email }, { username: username }],
      }).exec();
      if (
        existingUser.statusCode === StatusCodes.OK &&
        existingUser.status == true &&
        existingUser.data.documents?.length > 0
      ) {
        return {
          status: false,
          title: "User Already Exists",
          message: "User with this email or username already exists",
        };
      }

      // Validate the userData against the schema
      const validation = validateSchema(
        CentralDB_Auth_UserCollection_Schema,
        userData,
      );
      if (validation.status == false) {
        return {
          status: 400,
          title: "Validation Error",
          statusCode: StatusCodes.CONFLICT,
          message: validation.message || "Validation failed for user data",
        };
      }

      // Hash Password
      const hashedPassword = await bcrypt.hashPassword(userData.password);

      // Create User Object
      const user = {
        ...userData,
        password: hashedPassword,
      };

      // Create User in Database
      const createdUser = await CollectionInstance.insert(user);
      if (createdUser?.statusCode !== StatusCodes.OK) {
        return {
          status: false,
          title: "Error in Creating User",
          message: "User could not be created in the database",
        };
      }

      return {
        status: true,
        statusCode: StatusCodes.OK,
        title: "User Created Successfully",
        message:
          "User has been created successfully, please login with your credentials",
        data: {
          username: userData.username,
          password: userData.password,
        },
      };
    } catch (error) {
      console.error("Error in Registering User", error);
      return {
        status: false,
        title: "Error in Registering User",
        message: "Error in Registering User when creating user",
        data: error,
      };
    }
  }

  // Method to handle user login management
  public static async Login(
    userData: LoginRequest,
    CollectionInstance: Collection,
  ): Promise<any> {
    try {
      // check if all fields are filled
      for (const key in userData) {
        if (!userData[key as keyof LoginRequest]) {
          throw new Error(`${key} is required`);
        }
      }

      // check if username and password are provided
      if (!userData.username || !userData.password) {
        return {
          status: false,
          title: "Username and Password Required",
          message: "Username and Password are required",
        };
      }

      const { username, password } = userData; // Destructure the userData object

      // check if username already exists
      const existingUser = await CollectionInstance.query({
        username: username,
      }).exec();

      if (
        existingUser.statusCode === StatusCodes.OK &&
        existingUser.status == true &&
        existingUser.data.documents?.length === 0
      ) {
        return {
          status: false,
          title: "User Not Found",
          message: "User with this username does not exist",
        };
      }

      // check if password is correct
      const isPasswordCorrect = await bcrypt.comparePasswords(
        password,
        existingUser.data.documents[0]?.password,
      );

      if (!isPasswordCorrect) {
        return {
          status: false,
          title: "Incorrect Password",
          message: "Password is incorrect",
        };
      }

      // if AccessToken is already present, return it
      if (existingUser.data.documents[0]?.AccessToken) {
        delete existingUser.data.documents[0].password;
        delete existingUser.data.documents[0].AccessToken;
      }

      // generate access token
      const newAccessToken = new ClassBased.JWT_Manager(
        CentralInformation.CentralDB_JWT_Secret,
      ).generateLoginToken(existingUser.data.documents[0], 1, "24h");

      if (newAccessToken.status === false) {
        return {
          status: false,
          title: "Token Generation Failed",
          message: "Failed to generate access token",
        };
      }

      // Update in DB
      const updateResponse = await CollectionInstance.update({
        username: username,
      }).UpdateOne({ AccessToken: newAccessToken.toKen });

      if (
        updateResponse.status == true &&
        updateResponse.statusCode == StatusCodes.OK
      ) {
        // Return success message
        return {
          status: true,
          statusCode: StatusCodes.OK,
          title: "User Logged In Successfully",
          message: "User has been logged in successfully",
          data: {
            username: existingUser.data.documents[0].username,
            AccessToken: newAccessToken.toKen,
            willExpireIn: "24h",
            currentTimeStamp: newAccessToken.currentTimeStamp,
          },
        };
      } else {
        return {
          status: false,
          title: "Error in Updating Access Token",
          message: "Error in Updating Access Token in the database",
        };
      }
    } catch (error) {
      console.error("Error in Login User", error);
      return {
        status: false,
        title: "Error in Login User",
        message: "Error in Login User when creating user",
        data: error,
      };
    }
  }
}
