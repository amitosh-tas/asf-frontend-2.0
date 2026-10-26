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

export async function createWorkspace(data: WorkspaceWriteData) {
  return api.post("/api/platform-admin/workspaces", data);
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

export async function deleteWorkspace(
  workspaceId: string
){
  return api.delete(`/api/workspace/${workspaceId}`)
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