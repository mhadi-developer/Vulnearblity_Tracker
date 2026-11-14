"use client";

import {useContext , createContext , useState, useEffect, useMemo} from "react";

type AuthContextValue = {
    user: unknown;
    loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const APP_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;


export function AuthProvider({children}: Readonly<{children: React.ReactNode}>){
    const [user, setUser] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);


    const fetchLoggedInUser = async ()=>{
        try{
            setLoading(true)
            const response = await fetch(`${APP_URL}/user/get/me`,{
                method: "GET",
                headers:{
                    "Content-Type":"application/json"
                },
                credentials:'include'
            })

            if(response.ok){
               const loginUser = await response.json();
               setUser(loginUser)
               setLoading(false)
            }

           
        }catch(e){
           console.log('error to fetched loggedInUser------->',e)
        }finally{
            setLoading(false)
        }
    }

   useEffect(()=>{
    fetchLoggedInUser()
   },[])


    const contextValue = useMemo(() => ({user, loading}), [user, loading]);

    return <AuthContext.Provider value={contextValue}>
         {children}
    </AuthContext.Provider>

}


export const useAuth = ()=>{
    if (AuthContext){
        return useContext(AuthContext)
    }
    else{
        return null;
    }
}