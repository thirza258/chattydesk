export interface Response {
  "status": number;
  "message": string;
  "data": AIResponse;
}

export interface AIResponse {
  "response": string;
}
