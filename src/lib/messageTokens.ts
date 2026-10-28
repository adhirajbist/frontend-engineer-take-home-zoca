import { FIRST_NAME_TOKEN } from "./renderMessage";

/** Personal details the owner can drop into a message. Add new ones here. */
export const MESSAGE_TOKENS = [
  { id: "first_name", text: FIRST_NAME_TOKEN, label: "First name" },
] as const;

export type MessageToken = (typeof MESSAGE_TOKENS)[number];
export type TokenId = MessageToken["id"];

export function findToken(id: string): MessageToken | undefined {
  return MESSAGE_TOKENS.find((token) => token.id === id);
}
