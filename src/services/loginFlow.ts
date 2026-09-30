import type { UserAuth } from "@/interfaces/User/User.auth";

export interface InitialLoginResponse {
  token?: string;
  user?: UserAuth;
  two_factor_required?: boolean;
  challenge_token?: string;
  expires_in?: number;
}

interface LoginChallengeStore {
  beginLoginChallenge: (token: string, expiresIn?: number) => void;
}

export const handleInitialLoginResponse = (
  data: InitialLoginResponse,
  challengeStore: LoginChallengeStore,
  completeLogin: (data: { token: string; user: UserAuth }) => void,
): "challenge" | "authenticated" => {
  if (data.two_factor_required && data.challenge_token) {
    challengeStore.beginLoginChallenge(
      data.challenge_token,
      data.expires_in ?? 300,
    );
    return "challenge";
  }

  if (!data.token || !data.user) {
    throw new Error("Invalid login response");
  }

  completeLogin({ token: data.token, user: data.user });
  return "authenticated";
};
