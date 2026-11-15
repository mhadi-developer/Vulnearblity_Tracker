import type { IconName } from "../components/Icon";

export interface NavLink {
  href: string;
  label: string;
}

export type SeverityKey = "critical" | "high" | "medium" | "low";

export interface SeverityInfo {
  key: SeverityKey;
  label: string;
  count: number;
  color: string;
}

export interface Finding {
  id: string;
  title: string;
  sev: SeverityKey;
  status: string;
  owner: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface Feature {
  icon: IconName;
  title: string;
  text: string;
  grad: string;
}

export interface WorkflowStep {
  title: string;
  text: string;
}

export interface Endpoint {
  m: "get" | "post" | "patch" | "delete";
  path: string;
  note: string;
}


export type loginUserType = {
 full_name:string,
 user_name:string,
 email:string,
 id:number,
 created_at:string,
 role: string,
 role_id: number
}


/* 
created_at
: 
"2026-11-13T18:57:08.038535+00:00"
email
: 
"hadiquershi08@gmail.com"
full_name
: 
"Muhammad Hadi"
id
: 
1
user_name
: 
"hadi_dev_03"

*/
