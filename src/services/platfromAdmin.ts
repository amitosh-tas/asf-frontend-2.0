import { api } from "./api";

type TStatus = "invited" | "active" | "deactivated";

interface IUpdateUser {
  role: string;
  status: TStatus;
  // reason?: string;
}
interface IPlatformAdmin {
  name: string;
  email: string;
  password: string;
}

interface IUpdateAdmin {
  id: string;
  data: Partial<IPlatformAdmin>;
}

interface IUpdateUserProps {
  id: string;
  data: IUpdateUser;
}

export interface WorkspaceWriteData {
  name?: string;
  country?: string;
  industry?: string;
  timezone?: string;
  dataRegion?: string;
  reportingCurrency?: string;
  paymentMethod?: string;
  status?: string;
  defaultModel?: string;
  lookbackDays?: number;
  rawRetentionMonths?: number;
}

export interface CreateWorkspaceUserData {
  name: string;
  email: string;
  role: string;
}

interface IUpdateWorkspace {
  id: string;
  data: WorkspaceWriteData;
}

interface IDeleteUser{
  userId: string;
}

export async function getPlatformDashboard(){
  const res = await api.get("/api/platform-admin/dashboard")
  return res;
}

export async function getWorkspaces( page = 1){
  const res = await api.get("/api/platform-admin/workspaces", {
    params:{
      // reason: "am platform_admin bro ",
      page
    }
  })
  return res;
}

export async function getWorkspaceById(id: string){
  const res = await api.get(`/api/platform-admin/workspaces/${id}`,{
    params: {
      // reason: "am platform_admin bro ",
    }
  }
  );
  return res;
}

export async function updateUser( {id, data}: IUpdateUserProps){
  return await api.patch(`/api/platform-admin/users/${id}`, data)
}

export async function createWorkspace(data: CreateCompanyPayload) {
  return createCompanyWorkspace(data);
}

// export async function addWorkspaceUser(
//   workspaceId: string,
//   data: CreateWorkspaceUserData,
// ) {
//   return api.post(`/api/platform-admin/workspaces/${workspaceId}/users`, data);
// }

export async function addWorkspaceUser(
  workspaceId: string,
  data: CreateWorkspaceUserData,
) {
  return api.post(`/api/user/add-member`, {
    ...data,
    workspaceId
  });
}



export async function updateWorkspace({ id, data }: IUpdateWorkspace) {
  return api.patch(`/api/platform-admin/workspaces/${id}/settings`, {
    ...data,
    // reason: "am platform_admin bro "
  });
} 

export async function deleteUser({userId}: IDeleteUser){
  return api.delete(`/api/platform-admin/users/${userId}`)
}

/** Deletes the company and all of its data (audited; needs a written reason). */
export async function deleteWorkspace(workspaceId: string, reason: string) {
  return api.delete(`/api/workspace/${workspaceId}`, { data: { reason } });
}

export type WorkspaceStatusValue = "pending" | "active" | "suspended" | "closed";

/** Status changes are audited; suspending or closing needs a reason. Approving = status "active". */
export async function setWorkspaceStatus(workspaceId: string, status: WorkspaceStatusValue, reason?: string) {
  return api.patch(`/api/platform-admin/workspaces/${workspaceId}/status`, { status, reason });
}

export interface CreateCompanyPayload {
  name: string;
  country: string;
  timezone?: string;
  currency?: string;
  industry?: string;
  websiteUrl?: string;
  admin: { name: string; email: string; password: string };
}
/** Creates a company on its behalf (active, email verified). */
export async function createCompanyWorkspace(data: CreateCompanyPayload) {
  return api.post<{ data: { workspaceId: string; slug: string; adminUserId: string } }>("/api/platform-admin/workspaces", data);
}

export async function listApprovals() {
  return api.get<{ data: { id: string; name: string; slug: string; country: string; createdAt: string; emailVerified: boolean; websiteUrl?: string | null }[] }>("/api/platform-admin/approvals");
}

// Support tools (scope 4.9). Every call needs a written reason and lands in the company's audit log.
export async function replayWorkspaceEvents(workspaceId: string, body: { reason: string; from?: string; to?: string; status?: "failed" | "dead" | "all" }) {
  return api.post(`/api/platform-admin/workspaces/${workspaceId}/replay`, body);
}
export async function rerunWorkspaceAttribution(workspaceId: string, body: { reason: string; from?: string; to?: string }) {
  return api.post(`/api/platform-admin/workspaces/${workspaceId}/rerun-attribution`, body);
}
export async function rebuildWorkspaceRollups(workspaceId: string, reason: string) {
  return api.post(`/api/platform-admin/workspaces/${workspaceId}/rebuild-rollups`, { reason });
}
export async function rotateCompanyKeyAdmin(keyId: string, reason: string, graceHours = 24) {
  return api.post<{ id: string; key: string; previousKeyExpiresAt: string | null }>(`/api/platform-admin/api-keys/${keyId}/rotate`, { reason, graceHours });
}
/** keepAccount=true resets the data but keeps users and settings. `confirm` must be the company slug. */
export async function deleteCompanyData(workspaceId: string, body: { reason: string; confirm: string; keepAccount?: boolean }) {
  return api.delete(`/api/platform-admin/workspaces/${workspaceId}/data`, { data: body });
}

export async function revokeKeyAdmin(
  keyid: string
){
  return api.post(`/api/platform-admin/api-keys/${keyid}/revoke`,{
    // reason: "am platform_admin"
  })
}

export async function addPlatformAdmin(
  data: IPlatformAdmin
){
  return api.post(`/api/user/add-platform-admin`, data)
}

export async function getplatformAdmin(){
  return api.get(`/api/user/platform-admin`)
}

export async function getplatformAdmins(){
  return api.get(`/api/user/platform-admins`)
}
export async function deletePlatformAdmin(id: string) {
  return api.delete(`/api/user/platform-admins/${id}`);
}

export async function updatePlatformAdmin(
  {
    id,
    data
  }: IUpdateAdmin
){
  return api.patch(`/api/user/platform-admins/${id}`, data)
}