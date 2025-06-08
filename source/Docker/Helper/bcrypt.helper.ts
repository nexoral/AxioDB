import { compare, hash, genSalt } from "bcryptjs";

export default class bcrypt {
  // Method to hash password
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = await genSalt(10);
    const hashedPassword = await hash(password, saltRounds);
    return hashedPassword;
  }

  //  Method to compare password
  public static async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await compare(password, hashedPassword);
  }
}
