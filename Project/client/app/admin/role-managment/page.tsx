"use client";
import RoleManagementPage from "@/pages/RoleManagmentPage";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Loader";
import { redirect } from "next/navigation";
export default function RoleManagmentRouter(){
    const {user, loading} = useAuth()

    if(loading) return <Loader label="Loading users please wait"/>

    if(user?.role != "Admin" || user?.role_id != 1) return redirect("/");
    return (
        <RoleManagementPage/>
    )
}