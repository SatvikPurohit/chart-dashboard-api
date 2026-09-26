import { Request } from "express";

export interface DashboardRequest extends Request {
  // Keeps type tracking open for custom attributes if needed down the road
  [key: string]: any;
}
