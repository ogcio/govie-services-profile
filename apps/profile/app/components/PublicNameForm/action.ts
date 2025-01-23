"use server"

import { ApiProfileUser } from "../../../types";
import { cleanObjectFromNullOrUndefined } from "../../utils";
import { AuthenticationFactory } from "../../utils/authentication-factory";

export default async function updateProfileUserAction(prevState: ApiProfileUser & { userId: string } & { errors?: any }, formData: FormData) {
    // const { consentToPrefillData, dateOfBirth, email, gender, phone, ppsn, ppsnVisible, preferredLanguage, title, details } = prevState

    const firstname = formData.get("firstName")?.toString() || ""
    const lastname = formData.get("lastName")?.toString() || ""

    // const client = await AuthenticationFactory.getProfileClient()
    let error = 0
    try {
        // await client.updateUser(prevState.userId, {
        //     consentToPrefillData: consentToPrefillData || undefined,
        //     dateOfBirth: dateOfBirth || "",
        //     email,
        //     gender: gender || "",
        //     phone: phone || "",
        //     ppsn: ppsn || "",
        //     ppsnVisible: ppsnVisible || false,
        //     preferredLanguage,
        //     title: title || "",
        //     firstname, lastname
        // })
    } catch (err) {
        error = 1
    }

    return error ? prevState : { ...prevState, firstname, lastname }
}