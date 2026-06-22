export interface Credentials {
  email: string;
  passw: string;
}

export interface AuthSession {
  sid: string;
  credentials: Credentials;
}
