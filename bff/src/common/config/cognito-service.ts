import crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { AWS_REGION, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from "./env.ts";

const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

// === Helper tính SECRET_HASH ===
const getSecretHash = (username: string) => {
  return crypto
    .createHmac("SHA256", COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest("base64");
};

// === Đăng nhập ===
export const signIn = async (email: string, password: string) => {
  try {
    console.log("🔹 Query:", { email, password });

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: getSecretHash(email),
      },
    });

    const response = await cognitoClient.send(command);
    console.log("✅ SignIn success:", response.AuthenticationResult);
    console.log("✅ SignIn success:", response);
    return response.AuthenticationResult;
  } catch (err: any) {
    console.error("❌ Error login Cognito service:", err);
    if (err.name === "NotAuthorizedException") {
      console.log("⚠️ Sai mật khẩu hoặc user chưa confirmed");
    } else if (err.name === "UserNotFoundException") {
      console.log("⚠️ User không tồn tại trong pool");
    } else if (err.name === "InvalidParameterException") {
      console.log("⚠️ Request thiếu hoặc sai tham số (thường do SECRET_HASH)");
    }
    throw err;
  }
};
